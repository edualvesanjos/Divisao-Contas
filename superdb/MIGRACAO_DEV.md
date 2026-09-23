# Migração DEV para SuperDB — v0.9.1

Esta versão é um checkpoint de preparação; **não é uma migração de dados concluída**. O ZIP não contém dados, contas, senhas ou acesso ao Supabase/SuperDB. Nunca coloque senha de banco, service_role ou CSV de usuários no repositório nem neste ZIP.

## Ordem de execução

1. Mantenha a v0.9.0 DEV e o Supabase DEV disponíveis. Faça um backup verificável do banco DEV existente e confira a quantidade de linhas nas quatro tabelas (`contas_consumo`, `abastecimentos`, `configuracoes`, `fechamentos_mensais`), por usuário.
2. Crie um projeto **exclusivo para DEV** no SuperDB. Anote o slug e a chave **anon** no painel, sem compartilhar chaves administrativas.
3. Exporte o esquema efetivo e os dados do Supabase DEV usando o método do guia oficial. O `supabase/schema.sql` deste repositório é referência histórica e não substitui o esquema efetivo, incluindo as migrations 002 a 007. Ajuste o esquema para o schema `proj_<slug>` fornecido pelo SuperDB; valide com o painel as referências a usuários antes de importar tabelas. Não execute cegamente o dump no `public`: o SDK envia o perfil do projeto.
4. Migre as contas autenticadas **mantendo os mesmos UUIDs**, e verifique as referências `user_id`. Preserve hashes de senha somente em transferência segura. Confira dados, índices, triggers e RLS no novo banco. Teste que o usuário A não lê nem altera dados do usuário B.
5. Em `js/environment.js`, preencha apenas `project` e `key` do projeto SuperDB DEV. Deixe `migrationReady: false` enquanto confere a importação. Nesse estado, o login funciona, mas a sincronização remota fica bloqueada. O IndexedDB DEV novo está vazio e separado do cache Supabase anterior.
6. Depois de conferir as contagens por tabela e UUID, passe `migrationReady` para `true`, publique na branch de desenvolvimento e abra em uma aba nova. Teste login com senha antiga; leitura inicial; criação, edição e exclusão em cada módulo; fechar e reabrir; intervalo superior a uma hora; modo offline e volta da conexão; importação e exclusão seletiva.
7. Reconfira as contagens no SuperDB e a integridade dos fechamentos. Não promova esta versão a PROD antes de homologar DEV. Preserve o Supabase DEV durante os testes para retorno.

O cadastro está temporariamente desabilitado para evitar novos UUIDs durante a migração. Para liberar a versão posterior, revisite o cadastro e a sincronização. O botão de sincronização forçada permanece bloqueado enquanto `migrationReady` for falso.

Referências técnicas: https://superdb.com.br/docs/guias/migrar-supabase e https://superdb.com.br/docs/sdk
