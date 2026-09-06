// =========================================================
// Armazenamento local (IndexedDB)
//
// Cada registro gravado localmente entra também numa fila de
// sincronização ('pending_sync' = true). O módulo sync.js lê
// essa fila para enviar ao Supabase quando houver conexão.
// Isso é o essencial do padrão offline-first: o app nunca
// espera a rede para responder ao usuário.
// =========================================================

const DB_NAME = 'contas-combustivel';
const DB_VERSION = 2;
const STORES = ['contas_consumo', 'abastecimentos', 'configuracoes'];

let dbPromise = null;

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
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function uuid() {
  return crypto.randomUUID();
}

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

export const localDb = {
  /** Busca um único registro pelo id. */
  async get(storeName, id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /** Lista todos os registros não excluídos de uma tabela, mais recentes primeiro. */
  async listAll(storeName) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const rows = request.result
          .filter((row) => !row.deleted)
          .sort((a, b) => (b.data_ordenacao || '').localeCompare(a.data_ordenacao || ''));
        resolve(rows);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /** Cria um registro localmente e marca para sincronização. */
  async create(storeName, fields) {
    const now = new Date().toISOString();
    const record = {
      id: uuid(),
      ...fields,
      updated_at: now,
      created_at: now,
      deleted: false,
      pending_sync: 1,
    };
    await withStore(storeName, 'readwrite', (store) => store.put(record));
    return record;
  },

  /** Cria ou substitui um registro com um id definido por quem chama (ex: configurações, uma linha por usuário). */
  async putWithId(storeName, id, fields) {
    const now = new Date().toISOString();
    const existing = await this.get(storeName, id);
    const record = {
      ...existing,
      id,
      ...fields,
      updated_at: now,
      created_at: existing?.created_at || now,
      deleted: false,
      pending_sync: 1,
    };
    await withStore(storeName, 'readwrite', (store) => store.put(record));
    return record;
  },

  /** Atualiza um registro existente e marca para sincronização. */
  async update(storeName, id, fields) {
    const db = await openDb();
    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!existing) throw new Error(`Registro ${id} não encontrado em ${storeName}`);

    const updated = {
      ...existing,
      ...fields,
      updated_at: new Date().toISOString(),
      pending_sync: 1,
    };
    await withStore(storeName, 'readwrite', (store) => store.put(updated));
    return updated;
  },

  /** Marca como excluído (soft delete) e agenda a exclusão remota. */
  async remove(storeName, id) {
    return this.update(storeName, id, { deleted: true });
  },

  /** Retorna todos os registros pendentes de envio ao Supabase. */
  async listPendingSync(storeName) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => {
        resolve(request.result.filter((row) => row.pending_sync));
      };
      request.onerror = () => reject(request.error);
    });
  },

  /** Grava (ou sobrescreve) um registro vindo do servidor, já sincronizado. */
  async upsertFromRemote(storeName, record) {
    await withStore(storeName, 'readwrite', (store) =>
      store.put({ ...record, pending_sync: 0 })
    );
  },

  /** Limpa a flag de sincronização pendente após envio confirmado. */
  async clearPendingFlag(storeName, id) {
    const db = await openDb();
    const existing = await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!existing) return;
    await withStore(storeName, 'readwrite', (store) =>
      store.put({ ...existing, pending_sync: 0 })
    );
  },
};
