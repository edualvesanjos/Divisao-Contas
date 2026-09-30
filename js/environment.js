// v1.0.2: configuração centralizada dos ambientes DEV e PROD.
// As chaves anon são públicas e podem permanecer no frontend.
// Nunca use service_role/management key no frontend.

const ACTIVE_ENVIRONMENT = 'development';

const ENVIRONMENTS = Object.freeze({
  development: Object.freeze({
    url: 'https://auth.superdb.com.br',
    project: 'p_2d14f2f506',
    key: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRwa18yNjA2XzY1NzMwNTM2IiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiIwODUwZmI4OS0wOWYzLTRhOTYtYmQyYy1lNDk3MTY3N2I0MjQiLCJwcm9qZWN0X3NjaGVtYSI6InByb2pfcF8yZDE0ZjJmNTA2Iiwia3YiOjEsInN1YiI6ImFwaWtleTphbm9uIiwiaWF0IjoxNzkwNzczNzQzLCJpc3MiOiJodHRwczovL2F1dGguc3VwZXJkYi5jb20uYnIiLCJhdWQiOiJodHRwczovL2FwaS5zdXBlcmRiLmNvbS5iciJ9.kNh4w53gJgZF_e6-bxt9zc3d_ybVXEfjesFk7M6FUtrDVdTB1AVsagHjmCWPR1-C-YYO5oMFz6IGMEZu5q9q9A',
    schemaReady: true,
  }),
  production: Object.freeze({
    url: 'https://auth.superdb.com.br',
    project: 'p_988091b229',
    key: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRwa18yNjA2XzY1NzMwNTM2IiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiI4YmUzOGNmOC0wY2U3LTQzZjQtYWU3ZC05YTA0YzRmNThmOGEiLCJwcm9qZWN0X3NjaGVtYSI6InByb2pfcF85ODgwOTFiMjI5Iiwia3YiOjEsInN1YiI6ImFwaWtleTphbm9uIiwiaWF0IjoxNzkwNzkwMTYyLCJpc3MiOiJodHRwczovL2F1dGguc3VwZXJkYi5jb20uYnIiLCJhdWQiOiJodHRwczovL2FwaS5zdXBlcmRiLmNvbS5iciJ9.F1pCYjsdWfsd8bg9J5ReKJqWj1e8VbAT8P_eg1lQ8XM36-bp9GPRvWz3_4JmcLlxQw90D0_YWPfYa7L-CPmfEQ',
    schemaReady: true,
  }),
});

const EXPECTED_PROJECTS = Object.freeze({
  development: 'p_2d14f2f506',
  production: 'p_988091b229',
});

if (!ENVIRONMENTS[ACTIVE_ENVIRONMENT]) {
  throw new Error(`[ambiente] Ambiente inválido: ${ACTIVE_ENVIRONMENT}`);
}

if (ENVIRONMENTS[ACTIVE_ENVIRONMENT].project !== EXPECTED_PROJECTS[ACTIVE_ENVIRONMENT]) {
  throw new Error(`[ambiente] Projeto SuperDB incompatível com ${ACTIVE_ENVIRONMENT}.`);
}

export const APP_ENVIRONMENT = ACTIVE_ENVIRONMENT;
export const isDevelopment = APP_ENVIRONMENT === 'development';
export const superdbConfig = ENVIRONMENTS[APP_ENVIRONMENT];
