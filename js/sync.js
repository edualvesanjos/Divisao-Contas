// Sincronização local <-> SuperDB — v0.9.6 DEV.
// Sem Realtime: fila local por registro, push de pendências e pull paginado.

import { superdb } from './superdb-client.js';
import { superdbConfig } from './environment.js';
import { getSession } from './auth.js';
import { localDb } from './db-local.js';

const TABLES = ['contas_consumo', 'abastecimentos', 'configuracoes', 'fechamentos_mensais'];
const PAGE_SIZE = 500;
let syncInProgress = null;
let watcherCleanup = null;
let syncState = { status: 'idle', pending: 0, error: null, lastSyncAt: null };
const stateListeners = new Set();
let conflictResolver = null;

export function setConflictResolver(resolver) {
  conflictResolver = typeof resolver === 'function' ? resolver : null;
}

async function fetchRemoteRecord(storeName, userId, id) {
  const { data, error } = await superdb
    .from(storeName)
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .range(0, 0);
  if (error) throw error;
  return (data || [])[0] || null;
}

function stripLocalMetadata(record) {
  const {
    pending_sync,
    data_ordenacao,
    _sync_base_updated_at,
    ...payload
  } = record;
  return payload;
}


export function isOnline() { return navigator.onLine; }
export function getSyncState() { return { ...syncState }; }
export function onSyncStateChange(callback) {
  stateListeners.add(callback);
  callback(getSyncState());
  return () => stateListeners.delete(callback);
}
function setSyncState(patch) {
  syncState = { ...syncState, ...patch };
  for (const callback of stateListeners) callback(getSyncState());
}
async function refreshPending(userId) {
  const pending = userId ? await localDb.countPending(userId) : 0;
  setSyncState({ pending });
  return pending;
}

async function pushPending(storeName, userId) {
  const pending = await localDb.listPendingSync(storeName, userId);
  for (const record of pending) {
    const payload = stripLocalMetadata(record);
    const remote = await fetchRemoteRecord(storeName, userId, record.id);
    const baseUpdatedAt = record._sync_base_updated_at ?? null;
    const remoteUpdatedAt = remote?.updated_at ?? null;

    const conflict = remote
      ? (baseUpdatedAt === null || remoteUpdatedAt !== baseUpdatedAt)
      : baseUpdatedAt !== null;

    if (conflict) {
      if (!conflictResolver) {
        const error = new Error(`Conflito de sincronização em ${storeName}/${record.id}.`);
        error.code = 'SYNC_CONFLICT';
        throw error;
      }
      const choice = await conflictResolver({ storeName, local: record, remote });
      if (choice === 'remote') {
        if (remote) await localDb.acceptRemoteVersion(storeName, remote);
        else await localDb.hardDelete(storeName, record.id);
        continue;
      }
      if (choice !== 'local') {
        const error = new Error(`Conflito pendente em ${storeName}/${record.id}.`);
        error.code = 'SYNC_CONFLICT';
        throw error;
      }
    }

    const { error } = await superdb.from(storeName).upsert(payload);
    if (error) {
      console.error(`[sync] SuperDB recusou ${storeName}/${payload.id}:`, error.message, error);
      throw error;
    }
    const cleared = await localDb.clearPendingFlagIfUnchanged(storeName, record.id, record.updated_at);
    if (cleared) {
      // O trigger do banco é a fonte autoritativa de updated_at.
      // Releia a linha após o upsert para não depender do relógio do navegador.
      const confirmedRemote = await fetchRemoteRecord(storeName, userId, record.id);
      if (confirmedRemote) await localDb.acceptRemoteVersion(storeName, confirmedRemote);
    }
  }
}

async function pullRemote(storeName, userId) {
  let from = 0;
  while (true) {
    const { data, error } = await superdb
      .from(storeName)
      .select('*')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      console.error(`[sync] erro ao buscar ${storeName}:`, error.message, error);
      throw error;
    }
    const rows = data || [];
    for (const record of rows) {
      const dataOrdenacao = storeName === 'contas_consumo'
        ? record.competencia || record.data_vencimento || record.created_at?.slice(0, 10)
        : record.data || record.created_at?.slice(0, 10);
      await localDb.upsertFromRemote(storeName, { ...record, data_ordenacao: dataOrdenacao });
    }
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
}

async function runSync(userId) {
  if (!isOnline() || !userId || !superdbConfig.schemaReady) {
    await refreshPending(userId).catch(() => {});
    setSyncState({ status: isOnline() ? 'idle' : 'offline' });
    return false;
  }
  const session = await getSession();
  if (session?.user?.id !== userId) throw new Error('Sessão SuperDB inválida para sincronização.');
  localDb.setUserContext(userId);
  setSyncState({ status: 'syncing', error: null });
  await refreshPending(userId);
  try {
    for (const table of TABLES) {
      await pushPending(table, userId);
      await pullRemote(table, userId);
    }
    const pending = await localDb.countPending(userId);
    setSyncState({ status: pending ? 'pending' : 'synced', pending, error: null, lastSyncAt: new Date().toISOString() });
    return true;
  } catch (error) {
    const pending = await localDb.countPending(userId).catch(() => syncState.pending);
    setSyncState({ status: 'error', pending, error: error?.message || String(error) });
    throw error;
  }
}

export function syncAll(userId) {
  if (syncInProgress) return syncInProgress;
  syncInProgress = runSync(userId).finally(() => { syncInProgress = null; });
  return syncInProgress;
}

export function watchConnectivity(getUserId, onSync) {
  if (watcherCleanup) watcherCleanup();
  let debounceTimer = null;
  const trigger = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const userId = getUserId();
      if (!userId) return;
      syncAll(userId).then((ok) => ok && onSync?.()).catch((error) => console.error('[sync] falha:', error));
    }, 1200);
  };
  const onVisibility = () => { if (document.visibilityState === 'visible') trigger(); };
  const onOffline = () => setSyncState({ status: 'offline' });
  window.addEventListener('online', trigger);
  window.addEventListener('offline', onOffline);
  window.addEventListener('focus', trigger);
  document.addEventListener('visibilitychange', onVisibility);
  const interval = setInterval(trigger, 5 * 60 * 1000);
  watcherCleanup = () => {
    clearTimeout(debounceTimer);
    clearInterval(interval);
    window.removeEventListener('online', trigger);
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('focus', trigger);
    document.removeEventListener('visibilitychange', onVisibility);
    watcherCleanup = null;
  };
  return trigger;
}
