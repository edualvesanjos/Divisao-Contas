-- =========================================================
-- Migração 003 — Fechamento mensal + tipo de combustível
-- Rode isso DEPOIS das migrações 002.
-- Não apaga dados existentes.
-- =========================================================

-- ---------------------------------------------------------
-- Nova tabela: fechamentos_mensais
-- Um registro por usuário/ano/mês, controlando pagamento e
-- transferência de rateio no nível do MÊS (não mais por lançamento).
-- ---------------------------------------------------------
create table if not exists public.fechamentos_mensais (
  id text primary key, -- formato: '<user_id>::<ano>-<mes com 2 dígitos>'
  user_id uuid not null references auth.users(id) on delete cascade,

  ano integer not null,
  mes integer not null check (mes between 1 and 12),

  contas_pago boolean not null default false,
  contas_data_pagamento date,
  contas_data_rateio date,
  combustivel_data_rateio date,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),

  unique (user_id, ano, mes)
);

alter table public.fechamentos_mensais enable row level security;

create policy "fechamentos_mensais_select_own"
  on public.fechamentos_mensais for select
  using (auth.uid() = user_id);

create policy "fechamentos_mensais_insert_own"
  on public.fechamentos_mensais for insert
  with check (auth.uid() = user_id);

create policy "fechamentos_mensais_update_own"
  on public.fechamentos_mensais for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger trg_fechamentos_mensais_updated_at
  before update on public.fechamentos_mensais
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- abastecimentos: tipo de combustível (substitui o uso de km_atual)
-- km_atual continua existindo na tabela, só deixa de ser usado
-- pelo formulário — não removemos a coluna para não arriscar dados.
-- ---------------------------------------------------------
alter table public.abastecimentos
  add column if not exists tipo_combustivel text
    check (tipo_combustivel in ('gasolina', 'etanol'));

-- =========================================================
-- Fim da migração 003.
-- Os campos antigos por lançamento (pago, data_pagamento,
-- data_transferencia_rateio em contas_consumo/abastecimentos)
-- continuam existindo no banco mas não são mais preenchidos
-- pelo app — o controle passou a ser mensal, via fechamentos_mensais.
-- =========================================================
