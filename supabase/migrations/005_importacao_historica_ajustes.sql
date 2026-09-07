-- =========================================================
-- Migração 005 — Ajustes da importação histórica v0.7.0.1
-- Rode DEPOIS da migration 004 no Supabase DEV.
-- =========================================================

-- Permite preservar a categoria histórica "Nivel 6 Mercado Livre".
alter table public.contas_consumo
  drop constraint if exists contas_consumo_tipo_check;

alter table public.contas_consumo
  add constraint contas_consumo_tipo_check
  check (tipo in ('agua', 'luz', 'internet', 'mercado_livre'));

-- Identifica fechamentos criados pela importação, permitindo limpeza
-- seletiva sem atingir fechamentos criados manualmente.
alter table public.fechamentos_mensais
  add column if not exists origem_importacao text;

create index if not exists idx_fechamentos_origem_importacao
  on public.fechamentos_mensais(user_id, origem_importacao);
