// v0.9.7 DEV: projeto SuperDB novo e vazio.
// Preencha SOMENTE o slug e a chave anon do NOVO projeto DEV.
// Nunca use service_role/management key no frontend.
export const APP_ENVIRONMENT = 'development';
export const isDevelopment = true;
export const superdbConfig = {
  url: 'https://auth.superdb.com.br',
  project: 'p_2d14f2f506',
  key: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRwa18yNjA2XzY1NzMwNTM2IiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiIwODUwZmI4OS0wOWYzLTRhOTYtYmQyYy1lNDk3MTY3N2I0MjQiLCJwcm9qZWN0X3NjaGVtYSI6InByb2pfcF8yZDE0ZjJmNTA2Iiwia3YiOjEsInN1YiI6ImFwaWtleTphbm9uIiwiaWF0IjoxNzkwNzczNzQzLCJpc3MiOiJodHRwczovL2F1dGguc3VwZXJkYi5jb20uYnIiLCJhdWQiOiJodHRwczovL2FwaS5zdXBlcmRiLmNvbS5iciJ9.kNh4w53gJgZF_e6-bxt9zc3d_ybVXEfjesFk7M6FUtrDVdTB1AVsagHjmCWPR1-C-YYO5oMFz6IGMEZu5q9q9A',
  // Libere somente depois de executar 01_criar_banco_limpo.sql e 02_conferir_banco_limpo.sql.
  schemaReady: true,
};
