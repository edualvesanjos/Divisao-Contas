-- =========================================================
-- Migração 006 — Reparo do tipo de conta para importação histórica
-- Execute no Supabase DEV antes de testar a v0.7.1 DEV revisada.
-- É idempotente: pode ser executada mesmo se a migration 005 já tiver sido aplicada.
-- =========================================================

alter table public.contas_consumo
  drop constraint if exists contas_consumo_tipo_check;

alter table public.contas_consumo
  add constraint contas_consumo_tipo_check
  check (tipo in ('agua', 'luz', 'internet', 'mercado_livre'));

alter table public.fechamentos_mensais
  add column if not exists origem_importacao text;

create index if not exists idx_fechamentos_origem_importacao
  on public.fechamentos_mensais(user_id, origem_importacao);

-- Conferência rápida:
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.contas_consumo'::regclass
--   and conname = 'contas_consumo_tipo_check';
