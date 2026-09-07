// =========================================================
// Cliente Supabase
// =========================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { APP_ENVIRONMENT, supabaseConfig } from './environment.js';

const SUPABASE_URL = supabaseConfig?.url ?? '';
const SUPABASE_ANON_KEY = supabaseConfig?.key ?? '';

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const isConfigured =
  isValidHttpUrl(SUPABASE_URL) &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.startsWith('COLE_AQUI');

if (!isConfigured) {
  document.body.innerHTML = `
    <div style="max-width:460px;margin:15vh auto;padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#16302D">
      <h1 style="font-size:1.2rem;margin-bottom:12px">⚠️ Configuração de banco pendente</h1>
      <p style="color:#5C7873;line-height:1.5">
        O ambiente <strong>${APP_ENVIRONMENT}</strong> ainda não possui uma configuração válida do Supabase.
        Abra <code>js/environment.js</code> e informe a URL e a publishable key correspondentes.
      </p>
    </div>`;
  throw new Error(`[supabase-client] Configuração inválida para o ambiente ${APP_ENVIRONMENT}.`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
