# Changelog

Convenção de versão: `x.x.x` para novas etapas/mudanças de versão,
`x.x.x.x` para correções (hotfixes) dentro da mesma versão.

## [0.1.0] — Etapa 1 (MVP)

- Estrutura inicial do app (SPA/PWA em HTML/CSS/JS puro)
- Login e cadastro via Supabase Auth (e-mail + senha)
- Cadastro e listagem de Contas de Consumo (Água, Luz, Internet), com
  valor total, valor rateado, vencimento e status de pagamento
- Cadastro e listagem de Abastecimentos, com valor total, valor rateado,
  litros, km e posto
- Armazenamento local offline-first (IndexedDB) com fila de sincronização
  automática ao reconectar
- Schema inicial do banco (Supabase) com RLS por usuário
- Botão de logout no cabeçalho do app
- `package.json` com servidor estático (`serve`) para preview automático no StackBlitz
