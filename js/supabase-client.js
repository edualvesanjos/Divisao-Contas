// =========================================================
// Cliente Supabase
//
// Preencha com os dados do SEU projeto (Configurações > API).
// Use sempre o projeto DEV enquanto estiver testando, e só
// aponte para PRODUÇÃO quando o app estiver estável — mesmo
// padrão usado no projeto de Utilitários Municipais.
// =========================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cihzervgauvahpnmvjmq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GA_4UlhVkjSJgnKQBaMWdA_tLZ1yxZQ';

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
    <div style="max-width:420px;margin:15vh auto;padding:24px;font-family:system-ui,sans-serif;text-align:center;color:#16302D">
      <h1 style="font-size:1.2rem;margin-bottom:12px">⚠️ Configuração pendente</h1>
      <p style="color:#5C7873;line-height:1.5">
        Abra <code>js/supabase-client.js</code> e preencha
        <code>SUPABASE_URL</code> e <code>SUPABASE_ANON_KEY</code>
        com os dados reais do seu projeto (Supabase → Configurações → API).
      </p>
    </div>`;
  throw new Error(
    '[supabase-client] Configuração ausente/inválida: preencha SUPABASE_URL e SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
