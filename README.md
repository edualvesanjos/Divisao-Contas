# Contas & Combustível — Etapa 1 (MVP)

Registro pessoal de contas de consumo (água, luz, internet) e abastecimentos de
combustível, com rateio de valores com outra pessoa. Offline-first, 100% online
para editar e publicar (StackBlitz + GitHub + Supabase).

## Estrutura

```
├── index.html              # telas: login, app, modais de cadastro
├── css/style.css           # estilo único do app
├── js/
│   ├── app.js               # orquestra tudo: abas, listas, formulários
│   ├── auth.js               # login/cadastro/sessão (Supabase Auth)
│   ├── db-local.js           # IndexedDB (fonte de dados local)
│   ├── sync.js                # sincroniza IndexedDB <-> Supabase
│   └── supabase-client.js     # config da conexão com o Supabase
├── manifest.json            # PWA (instalar no celular)
├── sw.js                    # cache do app shell p/ abrir offline
└── supabase/schema.sql      # tabelas + RLS para colar no Supabase
```

## Passo a passo (tudo pelo navegador)

1. **Suba este projeto para um repositório novo no GitHub** (crie o repo vazio
   no site do GitHub e depois faça upload destes arquivos, ou conecte via
   StackBlitz — ver abaixo).

2. **Abra no StackBlitz**: `stackblitz.com/github/SEU_USUARIO/SEU_REPO`

3. **Crie o projeto no Supabase** (supabase.com, plano Free) e depois:
   - Vá em **SQL Editor** e rode o conteúdo de `supabase/schema.sql`
   - Vá em **Configurações → API** e copie a `Project URL` e a `anon public key`
   - Cole essas duas informações em `js/supabase-client.js`, nas constantes
     `SUPABASE_URL` e `SUPABASE_ANON_KEY`

4. **Habilite confirmação de e-mail** (Authentication → Providers → Email) se
   quiser exigir verificação ao criar a conta, ou desative para testar mais rápido.

5. **Teste localmente no StackBlitz** (ele já sobe um preview automático).

6. **Publique no GitHub Pages**: nas configurações do repositório, ative Pages
   apontando pra branch `main`. A cada push feito pelo StackBlitz, o site
   atualiza sozinho.

## O que fica para depois (fora da Etapa 1)

- Importação do histórico da planilha (2021–2026)
- Relatórios e gráficos de gastos
- Suporte a mais tipos de conta além de Água/Luz/Internet
- Ícones reais do PWA (os caminhos em `manifest.json` estão previstos, mas os
  arquivos `icons/icon-192.png` e `icons/icon-512.png` ainda precisam ser
  criados/adicionados)

## Sobre a sincronização offline

Todo registro é salvo primeiro no IndexedDB do navegador (`js/db-local.js`) e
marcado como pendente. O módulo `js/sync.js` envia esses pendentes ao Supabase
assim que detecta conexão (evento `online`, foco na aba, ou a cada 5 minutos),
e baixa o que estiver no servidor. A estratégia de conflito é "o último que
salvou vale" — suficiente para uso de uma pessoa só, em um dispositivo por vez.
