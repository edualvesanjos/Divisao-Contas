import { superdb } from './superdb-client.js';

const listeners = new Set();
let authSubscription = null;
const notify = (session) => listeners.forEach((callback) => callback(session));

export async function getSession() {
  const { data, error } = await superdb.auth.getSession();
  if (error) throw error;
  return data?.session ?? null;
}

export async function signIn(email, password) {
  const { data, error } = await superdb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  notify(data.session);
  return data.session;
}

export async function signUp(email, password) {
  const { data, error } = await superdb.auth.signUp({ email, password });
  if (error) throw error;
  const session = data?.session ?? null;
  if (session) notify(session);
  return session;
}

export async function signOut() {
  const { error } = await superdb.auth.signOut();
  if (error) throw error;
  notify(null);
}

export function onAuthChange(callback) {
  listeners.add(callback);
  if (!authSubscription && typeof superdb.auth.onAuthStateChange === 'function') {
    const result = superdb.auth.onAuthStateChange((_event, session) => notify(session));
    authSubscription = result?.data?.subscription || result?.subscription || true;
  }
  return () => listeners.delete(callback);
}
