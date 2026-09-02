// =========================================================
// Cliente Supabase
//
// Preencha com os dados do SEU projeto (Configurações > API).
// Use sempre o projeto DEV enquanto estiver testando, e só
// aponte para PRODUÇÃO quando o app estiver estável — mesmo
// padrão usado no projeto de Utilitários Municipais.
// =========================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_KEY_DO_SEU_PROJETO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
