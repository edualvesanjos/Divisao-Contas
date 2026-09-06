# Changelog

Convenção de versão: `x.x.x` para novas etapas/mudanças de versão,
`x.x.x.x` para correções (hotfixes) dentro da mesma versão.

## [0.1.0.3] — Hotfix

- Corrigido bug de CSS que fazia a tela de login e a tela do app ficarem
  sobrepostas (o atributo `hidden` não estava vencendo regras de `display`
  mais específicas)
- Logout agora limpa a sessão local e recarrega a página, evitando login
  persistente ao reabrir o site

## [0.1.0.2] — Hotfix

- Credenciais reais do Supabase (URL/anon key) mantidas preenchidas em
  `js/supabase-client.js` desde a geração do projeto

## [0.1.0.1] — Hotfix

- Mensagem de erro clara na tela quando `SUPABASE_URL`/`SUPABASE_ANON_KEY`
  estão ausentes ou inválidas (antes travava tudo com erro só no console)
- Toast visível de sucesso/erro ao entrar, independente da transição de tela
- Blindagem contra falhas de sincronização/leitura local ao logar
- Ícones do PWA (`icons/icon-192.png`, `icons/icon-512.png`) adicionados

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
