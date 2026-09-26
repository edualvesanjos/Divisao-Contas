# Migração DEV para SuperDB — v0.9.3

## Primeiro acesso com a sincronização ativada

Antes de usar esta versão, confirme no Editor SQL: quatro chaves estrangeiras de usuário criadas; proprietários ausentes = 0; configuração com `id` igual ao UUID do usuário; 56 fechamentos com IDs iniciados pelo UUID novo. O cache IndexedDB desta versão é novo para que pendências geradas durante o cadastro com a v0.9.2 não sobrescrevam os dados importados. Abra o app com conexão, entre com a conta DEV e confira as quantidades de contas, abastecimentos e fechamentos. Confira novamente as contagens no banco depois da primeira sincronização. Não use o botão de sincronização forçada para a primeira leitura.

## Cadastro de teste pelo app

O slug DEV `p_bfd593d881` e a chave **anon** já estão preenchidos em `js/environment.js`. Não use a chave `service_role`. Abra o app por servidor HTTP, escolha **Criar uma conta**, informe um e-mail ainda não cadastrado neste projeto e uma senha de teste. Confirme o e-mail se solicitado; então entre na conta. O botão **Ver meu ID** mostra o UUID a conferir no SuperDB. Na v0.9.3, a sincronização remota está liberada após a conferência da migração.

Antes de associar os dados migrados ao novo UUID, confira se o novo usuário aparece em `proj_p_bfd593d881.auth_users` no Editor SQL e se o UUID da tabela corresponde ao exibido no app. Se a consulta continuar vazia, pare e investigue a divergência entre Auth e Editor SQL: cadastrar pelo app, por si só, não comprova a presença nessa tabela.

Esta versão é um checkpoint de preparação; **não é uma migração de dados concluída**. O ZIP não contém dados, contas, senhas ou acesso ao Supabase/SuperDB. Nunca coloque senha de banco, service_role ou CSV de usuários no repositório nem neste ZIP.

## Ordem de execução

1. Mantenha a v0.9.0 DEV e o Supabase DEV disponíveis. Faça um backup verificável do banco DEV existente e confira a quantidade de linhas nas quatro tabelas (`contas_consumo`, `abastecimentos`, `configuracoes`, `fechamentos_mensais`), por usuário.
2. Crie um projeto **exclusivo para DEV** no SuperDB. Anote o slug e a chave **anon** no painel, sem compartilhar chaves administrativas.
3. Exporte o esquema efetivo e os dados do Supabase DEV usando o método do guia oficial. O `supabase/schema.sql` deste repositório é referência histórica e não substitui o esquema efetivo, incluindo as migrations 002 a 007. Ajuste o esquema para o schema `proj_<slug>` fornecido pelo SuperDB; valide com o painel as referências a usuários antes de importar tabelas. Não execute cegamente o dump no `public`: o SDK envia o perfil do projeto.
4. Para este teste DEV, crie uma conta nova pelo app e valide seu UUID em `auth_users` antes de atualizar os `user_id` importados. Confira dados, índices, triggers e RLS no novo banco. Teste que o usuário A não lê nem altera dados do usuário B.
5. Em `js/environment.js`, o slug e a chave anon do projeto SuperDB DEV já estão preenchidos. A v0.9.3 ativa `migrationReady: true` após conferir a importação. O IndexedDB DEV novo está vazio e separado dos caches anteriores.
6. Depois de conferir as contagens por tabela e UUID, abra a v0.9.3 em uma aba nova. Teste login com a conta DEV nova; leitura inicial; criação, edição e exclusão em cada módulo; fechar e reabrir; intervalo superior a uma hora; modo offline e volta da conexão; importação e exclusão seletiva.
7. Reconfira as contagens no SuperDB e a integridade dos fechamentos. Não promova esta versão a PROD antes de homologar DEV. Preserve o Supabase DEV durante os testes para retorno.

Use o botão de sincronização forçada apenas após conferir a primeira leitura e antes de usá-lo avalie pendências locais, pois ele reenviará todos os registros do cache.

Referências técnicas: https://superdb.com.br/docs/guias/migrar-supabase e https://superdb.com.br/docs/sdk
