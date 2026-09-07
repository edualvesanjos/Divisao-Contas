# Contas & Combustível

Registro pessoal de contas de consumo (água, luz, internet) e abastecimentos de
combustível, com rateio de valores com outra pessoa. Offline-first, 100% online
para editar e publicar (StackBlitz + GitHub + Supabase).

## Versão atual

- **v0.7.0 DEV** — importação histórica XLSX com pré-visualização, competência mensal nas contas e preservação do percentual histórico do combustível.
- **v0.6.2 DEV** — padronização visual completa dos indicadores mensais e identificação do mês de referência do combustível no Resumo.
- **v0.6.1 DEV** — seleção direta de mês/ano e padronização visual dos subtotais; mantém os indicadores mensais da v0.6.0.
- **v0.5.0.3** — última versão estável de produção antes da série 0.6.x.
- **v0.5.0.1 DEV** — estabilização da sincronização offline-first.


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
   - Em seguida, rode `supabase/migrations/002_rateio_automatico.sql` (adiciona
     a tabela de Configurações e os campos de rateio automático)
   - Depois, rode `supabase/migrations/003_fechamento_mensal.sql` (adiciona
     a tabela de Fechamento Mensal e o tipo de combustível)
   - Vá em **Configurações → API** e copie a `Project URL` e a `anon public key`
   - Cadastre essas informações em `js/environment.js`, no bloco do ambiente correspondente (`development` ou `production`)

4. **Habilite confirmação de e-mail** (Authentication → Providers → Email) se
   quiser exigir verificação ao criar a conta, ou desative para testar mais rápido.

5. **Teste localmente no StackBlitz**: com o `package.json` incluído, o StackBlitz
   detecta o script `dev` e sobe um servidor estático (`serve`) sozinho ao abrir o
   projeto — o preview aparece automaticamente. Se não abrir, veja a aba **Ports**
   na barra lateral e clique na porta 3000.

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
e baixa o que estiver no servidor. Registros com alteração local ainda pendente
não são sobrescritos pelo download remoto. Quando não há pendência local, o
`updated_at` impede que um registro remoto mais antigo substitua uma versão local
mais recente.


## Ambientes DEV e PROD

A seleção do banco fica centralizada em `js/environment.js`.

- branch `develop`: use `APP_ENVIRONMENT = 'development'`;
- branch `main`: use `APP_ENVIRONMENT = 'production'`;
- o badge `DEV` aparece somente no ambiente de desenvolvimento;
- se as credenciais do ambiente ativo estiverem ausentes, o app interrompe a inicialização e informa a configuração pendente;
- use apenas a **publishable/anon key** no frontend. Nunca use `service_role`.
## Importação histórica XLSX (v0.7.0 DEV)

Antes do primeiro teste de importação, execute no **Supabase DEV**:

`supabase/migrations/004_competencia_importacao.sql`

A importação fica em **Config → Importar histórico da planilha**. O fluxo é: selecionar arquivo → analisar → conferir prévia/avisos → importar.

O perfil desta versão reconhece as abas `Contas Consumo AAAA` e `Combustivel AAAA` da planilha histórica utilizada no projeto. As contas importadas usam uma competência mensal própria; portanto, quando a planilha não possui vencimento real, o app exibe **Referência mês/ano** em vez de inventar uma data.

Nos abastecimentos históricos, o percentual mensal é inferido pela relação entre `TOTAL RATEADO` e `TOTAL`. Litros, posto e tipo de combustível permanecem não informados quando não existirem no arquivo de origem.

A leitura XLSX usa SheetJS CE 0.20.3 carregado no momento da página; por isso, a análise de uma planilha requer conexão disponível para carregar a biblioteca caso ela ainda não esteja no navegador.

