## v0.9.0 DEV

- Inicia a série de modernização visual e responsividade multidispositivo.
- Adota como referência visual obrigatória o dashboard aprovado pelo usuário: barra superior azul-marinho, navegação lateral, área central clara, cartões suaves e hierarquia visual limpa.
- **Resumo** passa a ser a tela inicial do sistema.
- Em desktop/notebook, a navegação principal passa para uma barra lateral fixa; em tablet/celular, permanece como navegação inferior adaptada.
- Reorganiza visualmente o Resumo Mensal para aproximá-lo da referência aprovada, preservando apenas as funcionalidades já existentes.
- Integra o seletor de mês/ano visualmente ao cabeçalho em telas maiores.
- Reposiciona o status de sincronização no rodapé da navegação lateral em desktop.
- Mantém a área de compartilhamento do Resumo com destaque visual compatível com a nova linguagem.
- Os importadores históricos e de complementação passam a ser ferramentas exclusivas de DEV: visíveis em `development` e ocultos em `production`.
- Não altera regras de negócio, cálculos, importações, sincronização ou schema do Supabase.
- Não requer nova migration.
- Cache do PWA atualizado para v0.9.0.

## v0.8.6 DEV

- Consolida a série v0.8.x antes do próximo fechamento de produção.
- Não adiciona novas funcionalidades de negócio.
- Atualiza `supabase/schema.sql` para refletir o schema completo atualmente exigido pelo aplicativo.
- Adiciona `supabase/verificar_release.sql`, consulta somente leitura para comparar DEV/PROD antes de releases e detectar colunas, RLS, políticas e constraints ausentes.
- Adiciona `docs/TESTES_v0.8.6.md` com checklist de regressão de autenticação, sincronização, lançamentos, fechamento, importações, postos, imagem do resumo, visão anual e PWA.
- Mantém todas as funcionalidades validadas até a v0.8.5.
- Não requer nova migration no Supabase para ambientes já atualizados pelas migrations 002–007.
- Cache do PWA atualizado para v0.8.6.

## v0.8.5 DEV

- Adiciona **Compartilhar resumo** na aba Resumo Mensal.
- Gera uma imagem PNG limpa do mês, sem menus ou campos de edição, pronta para encaminhamento ao segundo participante.
- A imagem inclui competência, totais de contas e combustível, valores rateados, litros, valor a transferir e situação do fechamento.
- Adiciona compartilhamento nativo da imagem quando suportado pelo dispositivo/navegador, com fallback automático para download do PNG.
- Adiciona botão **Baixar PNG** para salvar diretamente a imagem do resumo.
- Adiciona **Imprimir / Salvar PDF** na Visão Anual, com layout específico para impressão.
- O relatório anual preserva totais, comparativos, evolução mensal, categorias e indicadores de combustível.
- Não requer nova migration no Supabase.
- Cache do PWA atualizado para v0.8.5.

## v0.8.4 DEV

- Evolui a leitura histórica da aba **Anual**.
- Adiciona alternância do gráfico entre **Totais**, **Rateados** e **Litros**.
- Em Totais, compara mensalmente Contas e Combustível.
- Em Rateados, compara mensalmente os valores rateados de Contas e Combustível.
- Em Litros, separa mensalmente Gasolina e Etanol, sem estimar dados ausentes.
- Adiciona leitura automática do maior e do menor mês com dados para a métrica selecionada.
- Mantém os comparativos anuais, detalhamento por categoria e indicadores de combustível já validados.
- Melhora o comportamento do gráfico em telas menores, com controles adaptáveis e rolagem horizontal quando necessária.
- Não requer nova migration no Supabase.
- Cache do PWA atualizado para v0.8.4.

## v0.8.3.2.1 DEV

- Corrige erro de sintaxe `await is a reserved identifier` ao abrir a aplicação.
- Torna assíncrono o manipulador de **Novo**, permitindo aguardar o carregamento dos postos antes de abrir Novo Abastecimento.
- Mantém as correções da v0.8.3.2 para fechamento independente do Gerenciador de Postos e seleção explícita de postos.
- Não requer nova migration no Supabase.

## v0.8.3.2 DEV

- Corrige o fechamento do Gerenciador de Postos para não fechar o modal de Novo Abastecimento.
- Substitui a sugestão via `datalist` por uma seleção explícita de postos, tornando a lista visível e selecionável de forma consistente entre navegadores.
- Atualiza a lista ao abrir ou editar um abastecimento e preserva postos históricos que não estejam mais na lista gerenciada.
- Mantém a migration 007, sem nova alteração de schema.

## v0.8.3.1 DEV

- Adiciona importação complementar de abastecimentos por **data + valor total**, sem criar novos lançamentos.
- A complementação atualiza somente tipo de combustível, litros e posto; valor, percentual, rateio e data existentes são preservados.
- Normaliza `Dt Clean` para Gasolina e `Posto Big` para `Posto Big Atibaia`.
- Exibe análise prévia com registros a atualizar, já completos, não localizados e ambiguidades.
- Adiciona **Gerenciar postos** no cadastro de combustível, com inclusão, renomeação e exclusão da lista sem alterar abastecimentos históricos.
- Corrige o carregamento da lista de postos após sincronização inicial e sincronização forçada.
- Adiciona `007_postos_gerenciados.sql` para sincronizar a lista gerenciada de postos entre dispositivos.
- Mantém ambiente de desenvolvimento.

## v0.8.3 DEV

- Adiciona **Indicadores de combustível** à Visão Anual.
- Exibe litros no ano, média mensal de litros, gasto médio por abastecimento e preço médio ponderado por litro quando há dados suficientes.
- Separa Gasolina e Etanol em tabela anual com quantidade de abastecimentos, litros, gasto e preço médio por litro; registros sem tipo informado aparecem em linha própria quando existirem.
- Os cálculos de litros e preço por litro consideram somente registros com quantidade de litros válida, evitando estimativas sobre dados históricos incompletos.
- Mantém o combustível anual associado ao mês real do abastecimento, sem alterar a regra especial do Resumo Mensal.
- Garante referência explícita ao `favicon.ico` no `index.html` e adiciona o ícone ao cache do PWA.
- Ambiente permanece em desenvolvimento.
- Não requer nova migration do Supabase.

## v0.8.2 DEV

- Adicionado detalhamento anual das contas por categoria: Água, Luz, Internet e Nivel 6 Mercado Livre.
- Cada categoria apresenta total anual, média mensal, participação percentual e diferença em relação ao ano comparado.
- A média mensal por categoria considera apenas os meses em que a categoria possui lançamentos.
- Mantidos os comparativos anuais avançados introduzidos na v0.8.1.
- Corrigido o 404 do favicon com inclusão de `favicon.ico` na raiz e referência explícita no `index.html`.
- Ambiente permanece em desenvolvimento.
- Não requer nova migration do Supabase.

## v0.8.1 DEV

- Evolui a aba **Anual** com comparação entre dois anos escolhidos pelo usuário.
- Adiciona seletor **Comparar com**, independente do ano base.
- Os indicadores anuais passam a exibir diferença absoluta em R$ e variação percentual em relação ao ano selecionado para comparação.
- Adiciona tabela mensal comparativa com total dos dois anos, diferença total, diferença percentual, diferença de Contas e diferença de Combustível.
- Destaca automaticamente o mês com maior aumento e o mês com maior redução do gasto total.
- Mantém a Visão Anual baseada no mês real dos lançamentos e preserva todas as regras do Resumo Mensal.
- Ambiente retornado para **development**.
- Não requer nova migration no Supabase.

## v0.8.0 PROD

- Versão de produção fechada a partir da **v0.8.0.1 DEV validada**.
- Publica a nova **Visão Anual e Comparativos Históricos**.
- Inclui seleção de ano, consolidação mensal/anual, comparação com o ano anterior, evolução mensal, totais rateados e indicadores históricos.
- Incorpora a correção validada do carregamento da visão anual.
- Ambiente alterado para **production**, utilizando a configuração de Supabase PROD.
- Não requer nova migration no Supabase.
- Nenhuma alteração funcional adicional foi introduzida no fechamento de produção.

## v0.8.0.1 DEV

- Corrige erro de sintaxe no `app.js` causado pela declaração duplicada da função `somarCampo`.
- Restaura o carregamento normal da interface e da nova aba **Anual**.
- Mantém integralmente as funcionalidades previstas na v0.8.0 DEV.
- Não requer nova migration no Supabase.

## v0.8.0 DEV

- Inicia a série de **Visão Anual e Comparativos Históricos**.
- Adiciona nova aba **Anual** com seleção direta do ano disponível na base.
- Consolida totais anuais de Contas, Combustível, Total Rateado e Total Geral.
- Compara automaticamente o ano selecionado com o ano imediatamente anterior.
- Adiciona evolução mensal visual para Contas e Combustível.
- Adiciona tabela mensal com Contas, Combustível, Total e Rateado.
- Adiciona médias mensais anuais calculadas somente sobre meses que possuem lançamentos.
- Exibe maior mês do ano e quantidade de meses com lançamentos.
- A visão anual usa o mês real de cada lançamento de combustível; a regra especial de mês anterior permanece exclusiva do Resumo Mensal.
- Não altera registros históricos nem requer nova migration no Supabase.
- Cache do PWA atualizado para v0.8.0.

## v0.7.3 DEV

- Consolida o fluxo de importação histórica XLSX após a validação da v0.7.2.
- Corrige o contador principal para mostrar **registros analisados**, incluindo contas, abastecimentos e fechamentos.
- Adiciona detalhamento da classificação por grupo: Contas, Combustível e Fechamentos.
- Quando não há registros novos, a análise informa que a base já contém os itens e desabilita a importação desnecessária.
- Fechamentos passam a acompanhar corretamente a seleção de **Contas de consumo**; ao desmarcar Contas, fechamentos deixam de ser considerados/importados.
- Mantém duplicados e conflitos preservados sem sobrescrita.
- Não requer nova migration no Supabase.
- Cache do PWA atualizado para v0.7.3.

## v0.7.2 DEV

- Adiciona classificação preventiva da reimportação em **Novo**, **Duplicado** e **Conflito**.
- Contas são comparadas por tipo + competência; valor idêntico é duplicado e valor diferente na mesma competência é conflito.
- Abastecimentos idênticos por data + valor são ignorados por ocorrência; alterações em registros XLSX já importados são preservadas como conflito.
- Fechamentos mensais existentes deixam de ser sobrescritos automaticamente; diferenças são sinalizadas para conferência.
- A importação grava somente registros classificados como novos.
- A pré-visualização mostra status por registro, contadores e detalhes dos conflitos.
- Não requer nova migration no Supabase.
- Mantém as migrations 004, 005 e 006 como base de dados da série 0.7.x.
- Cache do PWA atualizado para v0.7.2.

## v0.7.1 DEV

- Corrige a exclusão de dados XLSX: exclusão remota por ID + remoção definitiva do cache local, evitando reidratação dos registros.
- Adiciona migration 006 idempotente para garantir o tipo histórico `mercado_livre` no constraint de `contas_consumo`.
- Evolui a pré-visualização da importação histórica XLSX.
- Adiciona status claro de validação: pronto, com avisos ou bloqueado por erro.
- Adiciona resumo por ano com quantidades de contas, abastecimentos e fechamentos reconhecidos.
- Separa a prévia em tabelas de Contas, Combustível e Meses pagos/Fechamentos.
- Exibe origem, competência/data, valores, rateio, percentual histórico e situação de pagamento para conferência.
- Erros estruturais passam a bloquear o botão de importação; avisos continuam permitindo importação após conferência.
- Não requer nova migration ou alteração no Supabase.
- Cache do PWA atualizado para v0.7.1.

## v0.7.0.1 DEV

- Corrige mapeamento histórico de contas e pagamentos.
- Reconhece Nivel 6 Mercado Livre.
- Interpreta Dt pg vl rateado como pagamento/transferência do mês.
- Adiciona exclusão seletiva dos dados importados.
- Remove aviso para Internet opcional ausente.
- Adiciona migration 005.

## v0.7.0 — DEV

- Início da série de importação histórica XLSX.
- Adicionado perfil para reconhecer abas `Contas Consumo AAAA` e `Combustivel AAAA`.
- Importação de contas usa `competencia` mensal, sem inventar data de vencimento para registros históricos.
- Importação de combustível preserva datas e infere o percentual histórico a partir de `TOTAL RATEADO / TOTAL`.
- Dados ausentes na planilha (tipo de combustível, litros e posto) são mantidos como não informados.
- Adicionada pré-visualização antes da gravação, seleção entre Contas/Combustível e avisos de inconsistência.
- Proteção inicial contra importação duplicada de registros equivalentes.
- Nova migration `004_competencia_importacao.sql` para competência e origem de importação.
- Cache do PWA atualizado para v0.7.0.

## v0.6.2 — DEV

- Contas e Combustível: os cards “Variação vs. mês anterior” e “Média mensal no ano” passam a usar o mesmo fundo e borda dos cards de subtotal e do aviso de mês fechado.
- Resumo: “Total Combustível” agora informa entre parênteses o mês/ano de referência efetivamente usado no cálculo, que corresponde ao mês anterior ao período selecionado.
- Alteração apenas visual/informativa; sem mudanças na lógica de cálculo ou no banco de dados.
- Cache do PWA atualizado para v0.6.2.
- Sem alterações de schema ou migrations no Supabase.

## v0.6.1 — DEV

- Navegação mensal: o nome do mês/ano no topo agora é clicável e abre um seletor direto de mês e ano.
- As setas de mês anterior/próximo foram preservadas para navegação rápida.
- O seletor de período pode ser fechado por Cancelar, clique fora ou tecla Esc; Enter no campo de ano aplica a seleção.
- Contas e Combustível: os cards de subtotal passaram a usar o mesmo fundo e borda do aviso de mês fechado, mantendo o padrão visual da interface.
- Cache do PWA atualizado para v0.6.1.
- Sem alterações de schema ou migrations no Supabase.

## v0.6.0 — DEV

- Contas e Combustível: adicionados subtotais mensais de valor total e valor rateado para conferência.
- Contas e Combustível: adicionada variação percentual do valor total em relação ao mês imediatamente anterior.
- Contas e Combustível: adicionada média mensal do valor total no ano selecionado, calculada somente sobre meses com lançamentos.
- Indicadores são atualizados ao trocar o mês, criar, editar ou excluir lançamentos.
- Ambiente alterado para desenvolvimento e cache do PWA atualizado para v0.6.0.
- Sem alterações de schema ou migrations no Supabase.

## v0.5.0.3 — Produção

- Configurado ambiente de produção com Supabase dedicado.
- Ambiente padrão alterado para `production`; badge DEV não é exibido.
- Mantida separação entre credenciais DEV e PROD.

## v0.5.0.3

- Separação explícita dos ambientes `development` e `production` em `js/environment.js`
- Banco atual preservado como ambiente DEV
- Configuração de produção preparada para receber Project URL e publishable key próprias
- Badge visual `DEV` exibido somente no ambiente de desenvolvimento
- Bloqueio preventivo quando o ambiente ativo estiver sem credenciais válidas
- Cache do PWA atualizado para v0.5.0.3

## v0.5.0.2 — Produção

- Versão DEV validada em testes e promovida para produção.
- Consolida os ajustes de fechamento mensal, percentual histórico, data única de transferência e centralização dos modais.

# Changelog

Convenção de versão: `x.x.x` para novas etapas/mudanças de versão,
`x.x.x.x` para correções (hotfixes) dentro da mesma versão.

## [0.5.0.2] — DEV — Ajustes no fechamento mensal e interface

- **Data de transferência única** no fechamento mensal; os dois campos legados do Supabase são mantidos e passam a receber a mesma data por compatibilidade
- **Mês fechado**: o Resumo Mensal exibe no topo um aviso quando já existe fechamento salvo para o mês selecionado
- **Percentual histórico do combustível**: meses fechados exibem o percentual efetivamente gravado nos abastecimentos incluídos no resumo; alterações posteriores no percentual padrão não recalculam lançamentos antigos
- Quando houver percentuais diferentes entre abastecimentos do mesmo fechamento, o resumo informa todos os percentuais efetivamente utilizados
- **Tela de lançamento**: modais de Contas e Combustível passam a abrir centralizados na tela, mantendo rolagem interna em telas menores
- Cache do Service Worker atualizado para a nova versão

## [0.5.0.1] — DEV — Estabilização da sincronização

- **Forçar sincronização de tudo**: agora também remarca e sincroniza a tabela
  `fechamentos_mensais`, criada na v0.5.0
- **Proteção offline-first**: registros locais com `pending_sync` não são mais
  sobrescritos pelo download do Supabase enquanto o envio local não tiver sido
  confirmado
- **Proteção contra dados remotos antigos**: quando não há alteração local
  pendente, o cache ignora um registro remoto cujo `updated_at` seja anterior
  ao registro local
- Cache do Service Worker atualizado para garantir a distribuição dos arquivos
  alterados desta versão

## [0.5.0] — Fechamento mensal, combustível defasado e ajustes de formulário

- **Contas**: removidos do formulário os campos "Já paga", "Data de
  pagamento" e "Data de transferência do rateio" — agora são controlados
  uma vez por mês, na aba Resumo ("Fechamento do mês")
- **Combustível**: campo "Km atual" trocado por "Tipo de combustível"
  (Gasolina/Etanol); "Data de transferência do rateio" também migrou pro
  Fechamento do mês; campo "Posto" agora sugere postos já digitados antes
  (autocomplete)
- **Resumo**: os totais de Combustível/Combustível Rateado/Litros agora
  usam o mês ANTERIOR ao mês exibido (lançou em agosto → conta em
  setembro); Contas continua usando o mês exibido normalmente. A aba
  Combustível continua listando pelo mês real do lançamento.
- **Resumo**: adicionados Total de Litros e Litros por tipo
  (Gasolina/Etanol)
- Nova tabela `fechamentos_mensais` no Supabase (migração
  `supabase/migrations/003_fechamento_mensal.sql`), um registro por
  usuário/ano/mês
- IndexedDB local subiu para versão 3 (nova store `fechamentos_mensais`)

## [0.4.0] — Melhorias de UI: navegação por mês + Resumo Mensal

- Navegador de mês (‹ Setembro 2026 ›) no topo do app, compartilhado entre
  as abas Contas, Combustível e Resumo
- Listas de Contas e Combustível agora filtram só os lançamentos do mês
  selecionado
- Nova aba **Resumo** com: Total Contas de Consumo, Total Combustível,
  Contas Rateadas, Combustível Rateado, e "Valor rateado a pagar" (soma
  do que a outra pessoa deve transferir naquele mês)
- Definido: rateio sempre entre 2 participantes; percentual do Combustível
  representa diretamente a parte da outra pessoa (sem necessidade de nome)

## [0.3.0.3] — Hotfix

- Corrigida a causa raiz da falha de sincronização: o campo local
  `data_ordenacao` (usado só para ordenar a lista no navegador) estava
  sendo enviado ao Supabase, que rejeitava com erro 400
  ("Could not find the 'data_ordenacao' column"). Agora esse campo é
  removido do payload antes do envio.
- Registros baixados do Supabase (que não têm `data_ordenacao`) agora
  recebem esse campo derivado localmente, mantendo a ordenação da lista correta.

## [0.3.0.2] — Hotfix

- Botão "Forçar sincronização de tudo" na aba Config, para reenviar
  registros que ficaram presos localmente (ex: marcados como sincronizados
  pelo bug do hotfix anterior, sem nunca terem chegado ao Supabase)
- Novo método `localDb.markAllForResync()` que remarca todos os registros
  de uma tabela local como pendentes, independente do estado atual

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
