// v0.9.1 DEV: somente SuperDB de desenvolvimento.
// Copie do painel o slug e a chave anon. Nunca use service_role.
export const APP_ENVIRONMENT = 'development';
export const isDevelopment = true;
export const superdbConfig = {
  url: 'https://auth.superdb.com.br',
  project: 'COLE_SLUG_DO_PROJETO_DEV',
  key: 'COLE_CHAVE_ANON_DO_PROJETO_DEV',
  // Libere somente após conferir usuários, dados e RLS no DEV.
  migrationReady: false,
};
