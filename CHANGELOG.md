# Changelog

Convenção de versão: `x.x.x` para novas etapas/mudanças de versão,
`x.x.x.x` para correções (hotfixes) dentro da mesma versão.

## [0.3.0.1] — Hotfix

- Corrigido bug crítico de sincronização: `sync.js` não verificava o `error`
  retornado pelo Supabase, então falhas de envio (RLS, coluna incompatível,
  etc.) eram silenciosas — o app marcava o registro como sincronizado sem
  ele ter chegado ao banco. Agora o erro é logado (`[sync] Supabase recusou...`)
  e o registro continua pendente até sincronizar de verdade.

## [0.3.0] — Etapa 2 (parte 2): rateio automático + Configurações

- Nova aba "Config" com nº de participantes padrão (Contas) e percentual
  padrão (Combustível), salvos por usuário e sincronizados
- Contas: campo de "valor rateado" trocado por "nº de participantes";
  o rateio (valor total ÷ participantes) é calculado e exibido em tempo real
- Combustível: campo de "valor rateado" trocado por "percentual rateado (%)";
  o rateio (valor total × percentual) é calculado e exibido em tempo real
- Ao editar um lançamento, participantes/percentual pré-preenchem com o
  valor salvo naquele lançamento (ou o padrão, se não houver)
- Nova tabela `configuracoes` no Supabase (migração
  `supabase/migrations/002_rateio_automatico.sql`) e novas colunas
  `numero_participantes` (contas_consumo) e `percentual_rateado` (abastecimentos)
- IndexedDB local subiu para versão 2 (nova store `configuracoes`)

## [0.2.0] — Etapa 2 (parte 1): editar e excluir lançamentos

- Botões de editar (✏️) e excluir (🗑️) em cada lançamento das listas de
  Contas e Combustível
- Modal de cadastro agora funciona também como edição, pré-preenchendo
  os campos do lançamento selecionado
- Botão "Excluir" dentro do modal, visível apenas ao editar
- Confirmação antes de excluir um lançamento
- Novo método `localDb.get()` para buscar um registro local pelo id

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
