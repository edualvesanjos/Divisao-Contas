// Sincronização local <-> SuperDB — v0.9.5 DEV.
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
    const { pending_sync, data_ordenacao, ...payload } = record;
    const { error } = await superdb.from(storeName).upsert(payload);
    if (error) {
      console.error(`[sync] SuperDB recusou ${storeName}/${payload.id}:`, error.message, error);
      throw error;
    }
    await localDb.clearPendingFlagIfUnchanged(storeName, record.id, record.updated_at);
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
