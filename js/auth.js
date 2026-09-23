import { superdb } from './superdb-client.js';

const listeners = new Set();
let refreshPromise;
const notify = (session) => listeners.forEach((callback) => callback(session));

async function refreshIfNeeded(session) {
  if (!session?.expires_at || session.expires_at * 1000 - Date.now() > 10 * 60 * 1000) return session;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      // Evita usar o mesmo refresh token em duas abas simultâneas.
      const refresh = async () => {
        const current = (await superdb.auth.getSession()).data?.session;
        if (current?.expires_at && current.expires_at * 1000 - Date.now() > 10 * 60 * 1000) return current;
        const { data, error } = await superdb.auth.refreshSession();
        if (error) throw error;
        return data.session;
      };
      return navigator.locks
        ? navigator.locks.request('contas-combustivel-superdb-dev-refresh', refresh)
        : refresh();
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function getSession() {
  const { data, error } = await superdb.auth.getSession();
  if (error) throw error;
  return refreshIfNeeded(data.session);
}

export async function signIn(email, password) {
  const { data, error } = await superdb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  notify(data.session);
  return data.session;
}

export async function signUp() {
  throw new Error('Cadastro temporariamente indisponível durante a migração DEV.');
}

export async function signOut() {
  const { error } = await superdb.auth.signOut();
  if (error) throw error;
  notify(null);
}

export function onAuthChange(callback) {
  listeners.add(callback);
  window.addEventListener('storage', async () => {
    try { notify(await getSession()); } catch (error) { console.warn('[auth] sessão:', error); }
  });
  const timer = setInterval(async () => {
    try { if (!await getSession()) notify(null); }
    catch (error) { console.warn('[auth] renovação:', error); }
  }, 5 * 60 * 1000);
  return () => { clearInterval(timer); listeners.delete(callback); };
}
