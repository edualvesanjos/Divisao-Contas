-- =========================================================
-- Contas de Consumo & Combustível — schema inicial (Etapa 1)
-- Rode isso no SQL Editor do seu projeto Supabase (DEV primeiro)
-- =========================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Tabela: contas_consumo
-- ---------------------------------------------------------
create table if not exists public.contas_consumo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  tipo text not null check (tipo in ('agua', 'luz', 'internet')),

  valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),

  data_vencimento date,
  pago boolean not null default false,
  data_pagamento date,

  data_transferencia_rateio date,

  -- controle de sincronização offline-first
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_contas_consumo_user on public.contas_consumo(user_id);
create index if not exists idx_contas_consumo_vencimento on public.contas_consumo(data_vencimento);

alter table public.contas_consumo enable row level security;

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

-- ---------------------------------------------------------
-- Tabela: abastecimentos
-- ---------------------------------------------------------
create table if not exists public.abastecimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  data date not null,
  valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),

  litros numeric(8,3),
  km_atual numeric(10,1),
  posto text,

  data_transferencia_rateio date,

  updated_at timestamptz not null default now(),
  deleted boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_abastecimentos_user on public.abastecimentos(user_id);
create index if not exists idx_abastecimentos_data on public.abastecimentos(data);

alter table public.abastecimentos enable row level security;

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

-- ---------------------------------------------------------
-- Trigger: manter updated_at sempre atualizado
-- (a sincronização offline-first usa esse campo para resolver conflitos)
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_contas_consumo_updated_at
  before update on public.contas_consumo
  for each row execute function public.set_updated_at();

create trigger trg_abastecimentos_updated_at
  before update on public.abastecimentos
  for each row execute function public.set_updated_at();

-- =========================================================
-- Fim do schema da Etapa 1.
-- A importação do histórico da planilha (2021-2026) fica para depois,
-- assim como o suporte a mais tipos de conta e relatórios.
-- =========================================================
