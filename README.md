> **v1.0.1 PROD — versão de produção validada.** Sincronização segura sem Realtime, resolução explícita de conflitos e backend SuperDB de produção.

# Contas & Combustíveis

Aplicativo PWA offline-first para contas de consumo, abastecimentos, rateios e fechamentos mensais.

## Backend de produção

- SuperDB em projeto de produção;
- sem Realtime;
- sincronização por registro via REST/SDK;
- RLS por `auth.uid()`;
- exclusão lógica (`deleted=true`);
- cache IndexedDB isolado por ambiente/projeto;
- nenhuma importação automática de dados ou usuários do banco anterior.

## Instalação do banco novo

1. Execute `superdb/01_criar_banco_limpo.sql` no Editor SQL do novo projeto.
2. Execute `superdb/02_conferir_banco_limpo.sql` e confirme os resultados.
3. Preencha somente o slug novo e a anon key nova em `js/environment.js`.
4. Mude `schemaReady` para `true` depois da conferência do banco.
5. Abra o app e autentique-se com a conta de produção.

Consulte `superdb/INSTALACAO_BANCO_NOVO.md` para a ordem completa.

## Estrutura principal

- `js/app.js`: interface e regras de negócio.
- `js/db-local.js`: IndexedDB e pendências offline.
- `js/sync.js`: sincronização sem Realtime.
- `js/auth.js`: autenticação e sessão SuperDB.
- `js/environment.js`: slug/anon key do ambiente.
- `superdb/`: scripts de instalação e conferência do banco novo.
- `supabase/`: histórico do esquema legado; **não usar para criar o novo SuperDB**.

## Desenvolvimento

O projeto é HTML/CSS/JavaScript estático. `npm run dev` usa `serve` na porta 3000. O fluxo Git do projeto mantém `develop` como branch de desenvolvimento, `homolog` para homologação e `main` para produção.
