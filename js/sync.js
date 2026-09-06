// =========================================================
// Sincronização local <-> Supabase
//
// Estratégia simples de "last write wins" usando updated_at.
// Isso é suficiente para uso pessoal (um usuário, um dispositivo
// por vez). Se um dia o app virar multiusuário/multidispositivo
// simultâneo, essa parte precisa de uma resolução de conflito
// mais cuidadosa — não fazer isso automaticamente sem revisar.
// =========================================================

import { supabase } from './supabase-client.js';
import { localDb } from './db-local.js';

const TABLES = ['contas_consumo', 'abastecimentos', 'configuracoes'];

export function isOnline() {
  return navigator.onLine;
}

/** Envia registros pendentes locais para o Supabase. */
async function pushPending(storeName) {
  const pending = await localDb.listPendingSync(storeName);
  for (const record of pending) {
    const { pending_sync, ...payload } = record;

    const { error } = payload.deleted
      ? await supabase.from(storeName).delete().eq('id', payload.id)
      : await supabase.from(storeName).upsert(payload);

    if (error) {
      console.error(`[sync] Supabase recusou ${storeName}/${payload.id}:`, error.message, error);
      continue; // não limpa o pending_sync — tenta de novo no próximo ciclo
    }

    await localDb.clearPendingFlag(storeName, record.id);
  }
}

/** Busca registros do Supabase e atualiza o cache local. */
async function pullRemote(storeName, userId) {
  const { data, error } = await supabase
    .from(storeName)
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error(`[sync] erro ao buscar ${storeName}:`, error.message);
    return;
  }

  for (const record of data) {
    await localDb.upsertFromRemote(storeName, record);
  }
}

/** Roda um ciclo completo de sincronização (envia e depois busca). */
export async function syncAll(userId) {
  if (!isOnline() || !userId) return;

  for (const table of TABLES) {
    try {
      await pushPending(table);
      await pullRemote(table, userId);
    } catch (err) {
      console.error(`[sync] falha ao sincronizar ${table}:`, err);
    }
  }
}

/** Liga a sincronização automática: ao reconectar, ao focar a aba, e por um intervalo. */
export function watchConnectivity(getUserId, onSync) {
  const trigger = () => {
    const userId = getUserId();
    if (userId) syncAll(userId).then(onSync);
  };

  window.addEventListener('online', trigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger();
  });
  window.addEventListener('focus', trigger);

  // sincronização periódica de segurança
  setInterval(trigger, 5 * 60 * 1000);

  return trigger;
}
