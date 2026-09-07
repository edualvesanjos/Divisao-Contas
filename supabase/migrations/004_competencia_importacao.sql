-- =========================================================
-- Migração 004 — Competência mensal + origem de importação
-- Necessária para a série v0.7.x (importação histórica XLSX)
-- Rode no Supabase DEV antes de testar a importação.
-- =========================================================

alter table public.contas_consumo
  add column if not exists competencia date;

alter table public.contas_consumo
  add column if not exists origem_importacao text;

alter table public.abastecimentos
  add column if not exists origem_importacao text;

-- Dados já existentes passam a ter como competência o mês do vencimento.
update public.contas_consumo
set competencia = date_trunc('month', data_vencimento)::date
where competencia is null
  and data_vencimento is not null;

create index if not exists idx_contas_consumo_competencia
  on public.contas_consumo(user_id, competencia);

-- As políticas RLS existentes continuam válidas porque as novas colunas
-- pertencem às mesmas tabelas e não alteram o escopo por user_id.
