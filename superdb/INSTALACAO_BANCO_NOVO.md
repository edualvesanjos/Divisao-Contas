# Banco novo SuperDB — v0.9.5 DEV

O banco DEV foi criado e validado manualmente em 30/09/2026.

- Projeto: `p_2d14f2f506`
- Sem Realtime.
- Sem importação de dados/usuários do ambiente de teste anterior.
- Quatro tabelas de domínio com RLS por `auth.uid()`.
- Exclusão lógica por `deleted`.
- `updated_at` atualizado por trigger no servidor.

`01_criar_banco_limpo.sql` é destinado apenas a um projeto novo/vazio. Não execute sobre este DEV já instalado.
`02_conferir_banco_limpo.sql` faz somente a conferência de contagem sem consultar schemas de sistema.
