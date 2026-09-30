# Testes v0.9.5 DEV — SuperDB novo e vazio

## Banco antes do app

- [ ] `01_criar_banco_limpo.sql` executado sem erro no projeto DEV novo.
- [ ] `02_conferir_banco_limpo.sql`: quatro tabelas encontradas.
- [ ] Contagens iniciais = 0 nas quatro tabelas de domínio.
- [ ] RLS ativa nas quatro tabelas.
- [ ] Policy own-only presente nas quatro tabelas.
- [ ] Quatro FKs apontando para `auth_users`.
- [ ] Quatro triggers de `updated_at`.
- [ ] Realtime não habilitado/necessário para estas tabelas.

## Configuração

- [ ] `js/environment.js` contém somente slug + anon key do projeto DEV novo.
- [ ] Nenhuma service-role/management key no frontend.
- [ ] `schemaReady: true` somente após a conferência SQL.
- [ ] App exibe v0.9.5.

## Autenticação e isolamento

- [ ] Criar usuário A pelo app e efetuar login.
- [ ] Criar usuário B pelo app e efetuar login separadamente.
- [ ] Usuário B não visualiza nem altera dados do usuário A.
- [ ] Trocar de usuário no mesmo navegador não mostra cache do usuário anterior.

## CRUD e soft delete

- [ ] Criar, editar e excluir conta.
- [ ] Criar, editar e excluir abastecimento.
- [ ] Salvar configurações e postos gerenciados.
- [ ] Criar/alterar fechamento mensal.
- [ ] Exclusões sincronizadas permanecem no banco com `deleted=true` e somem da UI.

## Offline e sincronização

- [ ] Criar/editar registro offline: indicador mostra pendência.
- [ ] Reconectar: pendência é enviada e indicador volta a Sincronizado.
- [ ] Clicar `Sincronizar agora` não recria pendências em registros já sincronizados.
- [ ] Foco/visibilidade/reconexão não iniciam ciclos simultâneos.
- [ ] Edição feita durante um envio não perde a flag pendente.
- [ ] Erro de rede mantém pendências e mostra estado de erro/offline coerente.
- [ ] Com mais de 500 registros em uma tabela, pull recebe todas as páginas.

## Duas abas / segundo dispositivo

- [ ] Abrir duas abas com a mesma conta e validar que não há loop de sincronização.
- [ ] Criar/editar em um dispositivo, sincronizar e conferir leitura no segundo.
- [ ] Registrar separadamente qualquer conflito concorrente; v0.9.5 não adiciona ainda UI de resolução explícita por registro.

## Regressão funcional

- [ ] Resumo mensal e referência do combustível.
- [ ] Visão anual e comparativos.
- [ ] Rateios e totais.
- [ ] Fechamento mensal.
- [ ] Importação XLSX DEV e exclusão dos importados por soft delete.
- [ ] Complementação de abastecimentos e gerenciador de postos.
- [ ] Compartilhar/baixar imagem do resumo.
- [ ] PWA abre novamente após atualização do cache.
