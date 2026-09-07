// =========================================================
// Ambiente e conexão com Supabase
//
// develop  -> APP_ENVIRONMENT = 'development'
// main     -> APP_ENVIRONMENT = 'production'
//
// A publishable/anon key do Supabase pode ficar no frontend;
// a proteção dos dados depende das políticas RLS.
// Nunca coloque service_role aqui.
// =========================================================

export const APP_ENVIRONMENT = 'production';

const SUPABASE_CONFIG = {
  development: {
    url: 'https://cihzervgauvahpnmvjmq.supabase.co',
    key: 'sb_publishable_GA_4UlhVkjSJgnKQBaMWdA_tLZ1yxZQ',
  },
  production: {
    url: 'https://vzuaqtsqdaxdapcgqyol.supabase.co',
    key: 'sb_publishable_t9OGx28wwGL0rrLXBK6bGw_Mmt8yijQ',
  },
};

export const supabaseConfig = SUPABASE_CONFIG[APP_ENVIRONMENT];
export const isDevelopment = APP_ENVIRONMENT === 'development';
