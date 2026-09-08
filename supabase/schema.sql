-- =========================================================
-- Contas & Combustível — schema consolidado v0.8.6
-- Para NOVOS ambientes Supabase.
-- Em ambientes existentes, preserve os dados e aplique as migrations
-- em ordem. Não use este arquivo para recriar tabelas existentes.
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Função comum de updated_at
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------
-- Tabela: contas_consumo
-- ---------------------------------------------------------
create table if not exists public.contas_consumo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  tipo text not null
    check (tipo in ('agua', 'luz', 'internet', 'mercado_livre')),

  valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),
  numero_participantes integer not null default 2
    check (numero_participantes >= 1),

  data_vencimento date,
  competencia date,

  -- Campos legados preservados por compatibilidade
  pago boolean not null default false,
  data_pagamento date,
  data_transferencia_rateio date,

  origem_importacao text,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_contas_consumo_user
  on public.contas_consumo(user_id);
create index if not exists idx_contas_consumo_vencimento
  on public.contas_consumo(data_vencimento);
create index if not exists idx_contas_consumo_competencia
  on public.contas_consumo(user_id, competencia);

alter table public.contas_consumo enable row level security;

drop policy if exists "contas_consumo_select_own" on public.contas_consumo;
drop policy if exists "contas_consumo_insert_own" on public.contas_consumo;
drop policy if exists "contas_consumo_update_own" on public.contas_consumo;
drop policy if exists "contas_consumo_delete_own" on public.contas_consumo;

create policy "contas_consumo_select_own"
  on public.contas_consumo for select
  using (auth.uid() = user_id);

create policy "contas_consumo_insert_own"
  on public.contas_consumo for insert
  with check (auth.uid() = user_id);

create policy "contas_consumo_update_own"
  on public.contas_consumo for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contas_consumo_delete_own"
  on public.contas_consumo for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_contas_consumo_updated_at on public.contas_consumo;
create trigger trg_contas_consumo_updated_at
  before update on public.contas_consumo
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Tabela: abastecimentos
-- ---------------------------------------------------------
create table if not exists public.abastecimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  data date not null,
  valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),
  percentual_rateado numeric(5,2) not null default 50.00
    check (percentual_rateado >= 0 and percentual_rateado <= 100),

  litros numeric(8,3),
  km_atual numeric(10,1),
  posto text,
  tipo_combustivel text
    check (tipo_combustivel in ('gasolina', 'etanol')),

  -- Campo legado preservado por compatibilidade
  data_transferencia_rateio date,

  origem_importacao text,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_abastecimentos_user
  on public.abastecimentos(user_id);
create index if not exists idx_abastecimentos_data
  on public.abastecimentos(data);

alter table public.abastecimentos enable row level security;

drop policy if exists "abastecimentos_select_own" on public.abastecimentos;
drop policy if exists "abastecimentos_insert_own" on public.abastecimentos;
drop policy if exists "abastecimentos_update_own" on public.abastecimentos;
drop policy if exists "abastecimentos_delete_own" on public.abastecimentos;

create policy "abastecimentos_select_own"
  on public.abastecimentos for select
  using (auth.uid() = user_id);

create policy "abastecimentos_insert_own"
  on public.abastecimentos for insert
  with check (auth.uid() = user_id);

create policy "abastecimentos_update_own"
  on public.abastecimentos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "abastecimentos_delete_own"
  on public.abastecimentos for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_abastecimentos_updated_at on public.abastecimentos;
create trigger trg_abastecimentos_updated_at
  before update on public.abastecimentos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Tabela: configuracoes
-- ---------------------------------------------------------
create table if not exists public.configuracoes (
  id uuid primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,

  numero_participantes_padrao integer not null default 2
    check (numero_participantes_padrao >= 1),
  percentual_combustivel_padrao numeric(5,2) not null default 50.00
    check (percentual_combustivel_padrao >= 0 and percentual_combustivel_padrao <= 100),
  postos_gerenciados jsonb,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.configuracoes.postos_gerenciados is
  'Lista de postos exibida no cadastro. NULL = ainda não inicializada; [] = lista deliberadamente vazia.';

alter table public.configuracoes enable row level security;

drop policy if exists "configuracoes_select_own" on public.configuracoes;
drop policy if exists "configuracoes_insert_own" on public.configuracoes;
drop policy if exists "configuracoes_update_own" on public.configuracoes;
drop policy if exists "configuracoes_delete_own" on public.configuracoes;

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

create policy "configuracoes_delete_own"
  on public.configuracoes for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_configuracoes_updated_at on public.configuracoes;
create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Tabela: fechamentos_mensais
-- ---------------------------------------------------------
create table if not exists public.fechamentos_mensais (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,

  ano integer not null,
  mes integer not null check (mes between 1 and 12),

  contas_pago boolean not null default false,
  contas_data_pagamento date,
  contas_data_rateio date,
  combustivel_data_rateio date,

  origem_importacao text,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,
  created_at timestamptz not null default now(),

  unique (user_id, ano, mes)
);

create index if not exists idx_fechamentos_origem_importacao
  on public.fechamentos_mensais(user_id, origem_importacao);

alter table public.fechamentos_mensais enable row level security;

drop policy if exists "fechamentos_mensais_select_own" on public.fechamentos_mensais;
drop policy if exists "fechamentos_mensais_insert_own" on public.fechamentos_mensais;
drop policy if exists "fechamentos_mensais_update_own" on public.fechamentos_mensais;
drop policy if exists "fechamentos_mensais_delete_own" on public.fechamentos_mensais;

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

create policy "fechamentos_mensais_delete_own"
  on public.fechamentos_mensais for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_fechamentos_mensais_updated_at on public.fechamentos_mensais;
create trigger trg_fechamentos_mensais_updated_at
  before update on public.fechamentos_mensais
  for each row execute function public.set_updated_at();

-- =========================================================
-- Fim do schema consolidado v0.8.6
-- =========================================================
