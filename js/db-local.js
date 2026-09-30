// Armazenamento local offline-first — v0.9.6 DEV.
// O nome do IndexedDB inclui ambiente + slug do projeto, impedindo reaproveitar
// o cache do banco DEV anterior. As leituras e pendências também ficam limitadas
// ao usuário autenticado neste navegador.

import { APP_ENVIRONMENT, superdbConfig } from './environment.js';

const safeProject = String(superdbConfig.project || 'nao-configurado').replace(/[^a-z0-9_-]/gi, '_');
const DB_NAME = `contas-combustivel-${APP_ENVIRONMENT}-${safeProject}-v0.9.5`; // preserva o cache validado da v0.9.5
const DB_VERSION = 1;
const STORES = ['contas_consumo', 'abastecimentos', 'configuracoes', 'fechamentos_mensais'];

let dbPromise = null;
let activeUserId = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('pending_sync', 'pending_sync');
          store.createIndex('user_id', 'user_id');
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function uuid() { return crypto.randomUUID(); }
function assertUser() {
  if (!activeUserId) throw new Error('Contexto local de usuário não definido.');
  return activeUserId;
}
function belongsToActiveUser(row) { return row?.user_id === activeUserId; }

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = callback(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

async function getRaw(storeName, id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export const localDb = {
  setUserContext(userId) {
    activeUserId = userId || null;
  },

  getDatabaseName() { return DB_NAME; },

  async get(storeName, id) {
    assertUser();
    const row = await getRaw(storeName, id);
    return belongsToActiveUser(row) ? row : null;
  },

  async listAll(storeName) {
    assertUser();
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result
        .filter((row) => belongsToActiveUser(row) && !row.deleted)
        .sort((a, b) => (b.data_ordenacao || '').localeCompare(a.data_ordenacao || '')));
      request.onerror = () => reject(request.error);
    });
  },

  async create(storeName, fields) {
    const userId = assertUser();
    if (fields?.user_id !== userId) throw new Error('Tentativa de gravar registro para outro usuário.');
    const now = new Date().toISOString();
    const record = { id: uuid(), ...fields, updated_at: now, created_at: now, deleted: false, pending_sync: 1, _sync_base_updated_at: null };
    await withStore(storeName, 'readwrite', (store) => store.put(record));
    return record;
  },

  async createMany(storeName, rows) {
    const userId = assertUser();
    if (!Array.isArray(rows) || rows.length === 0) return [];
    if (rows.some((row) => row?.user_id !== userId)) throw new Error('Lote contém registro de outro usuário.');
    const db = await openDb();
    const now = new Date().toISOString();
    const records = rows.map((fields) => ({ id: uuid(), ...fields, updated_at: now, created_at: now, deleted: false, pending_sync: 1, _sync_base_updated_at: null }));
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const record of records) store.put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return records;
  },

  async putWithId(storeName, id, fields) {
    const userId = assertUser();
    if (fields?.user_id !== userId) throw new Error('Tentativa de gravar registro para outro usuário.');
    const now = new Date().toISOString();
    const existing = await this.get(storeName, id);
    const baseUpdatedAt = existing?._sync_base_updated_at ?? (existing && !existing.pending_sync ? existing.updated_at : null);
    const record = { ...existing, id, ...fields, updated_at: now, created_at: existing?.created_at || now, deleted: false, pending_sync: 1, _sync_base_updated_at: baseUpdatedAt };
    await withStore(storeName, 'readwrite', (store) => store.put(record));
    return record;
  },

  async update(storeName, id, fields) {
    const userId = assertUser();
    const existing = await this.get(storeName, id);
    if (!existing) throw new Error(`Registro ${id} não encontrado em ${storeName}`);
    if (fields?.user_id && fields.user_id !== userId) throw new Error('Tentativa de transferir registro para outro usuário.');
    const baseUpdatedAt = existing?._sync_base_updated_at ?? (!existing.pending_sync ? existing.updated_at : null);
    const updated = { ...existing, ...fields, user_id: userId, updated_at: new Date().toISOString(), pending_sync: 1, _sync_base_updated_at: baseUpdatedAt };
    await withStore(storeName, 'readwrite', (store) => store.put(updated));
    return updated;
  },

  async remove(storeName, id) { return this.update(storeName, id, { deleted: true }); },

  async hardDelete(storeName, id) {
    const existing = await this.get(storeName, id);
    if (!existing) return;
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  },

  async listPendingSync(storeName, userId = activeUserId) {
    if (!userId || userId !== activeUserId) throw new Error('Usuário inválido para consultar pendências.');
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result.filter((row) => row.pending_sync && row.user_id === userId));
      request.onerror = () => reject(request.error);
    });
  },

  async countPending(userId = activeUserId) {
    let total = 0;
    for (const storeName of STORES) total += (await this.listPendingSync(storeName, userId)).length;
    return total;
  },

  async upsertFromRemote(storeName, record) {
    const userId = assertUser();
    if (record?.user_id !== userId) throw new Error('Resposta remota contém registro de outro usuário.');
    const existing = await getRaw(storeName, record.id);
    if (existing?.user_id && existing.user_id !== userId) throw new Error('Colisão de cache entre usuários.');
    if (existing?.pending_sync) return { applied: false, reason: 'local_pending' };
    const localUpdatedAt = Date.parse(existing?.updated_at || '');
    const remoteUpdatedAt = Date.parse(record.updated_at || '');
    if (existing && Number.isFinite(localUpdatedAt) && Number.isFinite(remoteUpdatedAt) && localUpdatedAt > remoteUpdatedAt) {
      return { applied: false, reason: 'local_newer' };
    }
    await withStore(storeName, 'readwrite', (store) => store.put({ ...record, pending_sync: 0, _sync_base_updated_at: record.updated_at || null }));
    return { applied: true };
  },

  async acceptRemoteVersion(storeName, record) {
    const userId = assertUser();
    if (record?.user_id !== userId) throw new Error('Resposta remota contém registro de outro usuário.');
    const dataOrdenacao = storeName === 'contas_consumo'
      ? record.competencia || record.data_vencimento || record.created_at?.slice(0, 10)
      : record.data || record.created_at?.slice(0, 10);
    await withStore(storeName, 'readwrite', (store) => store.put({
      ...record,
      data_ordenacao: dataOrdenacao,
      pending_sync: 0,
      _sync_base_updated_at: record.updated_at || null,
    }));
  },

  // Só confirma o envio se o registro não tiver sido editado enquanto a requisição estava em andamento.
  async clearPendingFlagIfUnchanged(storeName, id, sentUpdatedAt) {
    const existing = await this.get(storeName, id);
    if (!existing || existing.updated_at !== sentUpdatedAt) return false;
    await withStore(storeName, 'readwrite', (store) => store.put({ ...existing, pending_sync: 0 }));
    return true;
  },
};
