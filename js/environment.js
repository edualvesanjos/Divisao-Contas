// v1.0.1 PROD: projeto SuperDB de produção.
// A chave anon pública pode permanecer no frontend.
// Nunca use service_role/management key no frontend.
export const APP_ENVIRONMENT = 'production';
export const isDevelopment = false;
export const superdbConfig = {
  url: 'https://auth.superdb.com.br',
  project: 'p_988091b229',
  key: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRwa18yNjA2XzY1NzMwNTM2IiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiI4YmUzOGNmOC0wY2U3LTQzZjQtYWU3ZC05YTA0YzRmNThmOGEiLCJwcm9qZWN0X3NjaGVtYSI6InByb2pfcF85ODgwOTFiMjI5Iiwia3YiOjEsInN1YiI6ImFwaWtleTphbm9uIiwiaWF0IjoxNzkwNzkwMTYyLCJpc3MiOiJodHRwczovL2F1dGguc3VwZXJkYi5jb20uYnIiLCJhdWQiOiJodHRwczovL2FwaS5zdXBlcmRiLmNvbS5iciJ9.F1pCYjsdWfsd8bg9J5ReKJqWj1e8VbAT8P_eg1lQ8XM36-bp9GPRvWz3_4JmcLlxQw90D0_YWPfYa7L-CPmfEQ',
  schemaReady: true,
};
