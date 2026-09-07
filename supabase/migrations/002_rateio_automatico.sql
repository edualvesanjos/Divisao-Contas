-- =========================================================
-- Migração 002 — Rateio automático + Configurações (Etapa 2, parte 2)
-- Rode isso DEPOIS do supabase/schema.sql original.
-- Não apaga dados existentes — só adiciona colunas/tabela novas.
-- =========================================================

-- ---------------------------------------------------------
-- Nova tabela: configuracoes (uma linha por usuário)
-- ---------------------------------------------------------
create table if not exists public.configuracoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  numero_participantes_padrao integer not null default 2 check (numero_participantes_padrao >= 1),
  percentual_combustivel_padrao numeric(5,2) not null default 50.00
    check (percentual_combustivel_padrao >= 0 and percentual_combustivel_padrao <= 100),

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.configuracoes enable row level security;

create policy "configuracoes_select_own"
  on public.configuracoes for select
  using (auth.uid() = user_id);

create policy "configuracoes_insert_own"
  on public.configuracoes for insert
  with check (auth.uid() = user_id);

create policy "configuracoes_update_own"
  on public.configuracoes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- contas_consumo: rateio passa a ser por nº de participantes
-- ---------------------------------------------------------
alter table public.contas_consumo
  add column if not exists numero_participantes integer not null default 2
    check (numero_participantes >= 1);

-- ---------------------------------------------------------
-- abastecimentos: rateio passa a ser por percentual
-- ---------------------------------------------------------
alter table public.abastecimentos
  add column if not exists percentual_rateado numeric(5,2) not null default 50.00
    check (percentual_rateado >= 0 and percentual_rateado <= 100);

-- =========================================================
-- Fim da migração 002.
-- valor_rateado continua existindo nas duas tabelas — agora é
-- calculado no app a partir de numero_participantes/percentual_rateado
-- e gravado junto, pra não precisar recalcular toda hora na listagem.
-- =========================================================
