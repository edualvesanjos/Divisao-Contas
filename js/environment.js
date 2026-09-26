// v0.9.3 DEV: somente SuperDB de desenvolvimento.
// Chave anon publica do projeto DEV. Nunca use service_role.
export const APP_ENVIRONMENT = 'development';
export const isDevelopment = true;
export const superdbConfig = {
  url: 'https://auth.superdb.com.br',
  project: 'p_bfd593d881',
  key: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImRwa18yNjA2XzY1NzMwNTM2IiwidHlwIjoiSldUIn0.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJkZmFmZWI4OS1mOTRkLTQ4OWEtYWI1MC0xZDU0YmQxOTExOGIiLCJwcm9qZWN0X3NjaGVtYSI6InByb2pfcF9iZmQ1OTNkODgxIiwia3YiOjEsInN1YiI6ImFwaWtleTphbm9uIiwiaWF0IjoxNzkwMTI3NzE3LCJpc3MiOiJodHRwczovL2F1dGguc3VwZXJkYi5jb20uYnIiLCJhdWQiOiJodHRwczovL2FwaS5zdXBlcmRiLmNvbS5iciJ9.wZ5BkE1Zh6y8zFjQ_tM4c7ylHxfkpEWIcJAU2SewwUVMH4fJCPjZgass1ovL9pfNhTq06jurVQl7QX-FAXwH7w',
  // Usuario e chaves estrangeiras conferidos no SuperDB DEV.
  migrationReady: true,
};
