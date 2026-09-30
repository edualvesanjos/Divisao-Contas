-- Contas & Combustíveis v0.9.5 DEV
-- SuperDB: instalação NOVA e VAZIA.
-- Validado manualmente no projeto DEV em 30/09/2026.
-- Execute no Editor SQL do projeto novo. Não use BEGIN/COMMIT externo.
-- Não importa usuários/dados e não habilita Realtime.

create or replace function atualizar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table contas_consumo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  tipo text not null check (tipo in ('agua','luz','internet','mercado_livre')),
  valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),
  numero_participantes integer not null default 2 check (numero_participantes >= 1),
  data_vencimento date, competencia date,
  pago boolean not null default false, data_pagamento date, data_transferencia_rateio date,
  origem_importacao text, updated_at timestamptz not null default now(),
  deleted boolean not null default false, created_at timestamptz not null default now()
);

create table abastecimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  data date not null, valor_total numeric(10,2) not null check (valor_total >= 0),
  valor_rateado numeric(10,2) check (valor_rateado >= 0),
  percentual_rateado numeric(5,2) not null default 50.00 check (percentual_rateado between 0 and 100),
  litros numeric(8,3), km_atual numeric(10,1), posto text,
  tipo_combustivel text check (tipo_combustivel in ('gasolina','etanol')),
  data_transferencia_rateio date, origem_importacao text,
  updated_at timestamptz not null default now(), deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create table configuracoes (
  id uuid primary key, user_id uuid not null unique default auth.uid(),
  numero_participantes_padrao integer not null default 2 check (numero_participantes_padrao >= 1),
  percentual_combustivel_padrao numeric(5,2) not null default 50.00 check (percentual_combustivel_padrao between 0 and 100),
  postos_gerenciados jsonb, updated_at timestamptz not null default now(),
  deleted boolean not null default false, created_at timestamptz not null default now()
);
comment on column configuracoes.postos_gerenciados is
  'Lista de postos exibida no cadastro. NULL = ainda não inicializada; [] = lista deliberadamente vazia.';

create table fechamentos_mensais (
  id text primary key, user_id uuid not null default auth.uid(), ano integer not null,
  mes integer not null check (mes between 1 and 12), contas_pago boolean not null default false,
  contas_data_pagamento date, contas_data_rateio date, combustivel_data_rateio date,
  origem_importacao text, updated_at timestamptz not null default now(),
  deleted boolean not null default false, created_at timestamptz not null default now(),
  constraint fechamentos_mensais_user_ano_mes_unique unique (user_id, ano, mes)
);

create index idx_contas_consumo_user_updated on contas_consumo (user_id, updated_at);
create index idx_contas_consumo_user_competencia on contas_consumo (user_id, competencia);
create index idx_abastecimentos_user_updated on abastecimentos (user_id, updated_at);
create index idx_abastecimentos_user_data on abastecimentos (user_id, data);
create index idx_configuracoes_user_updated on configuracoes (user_id, updated_at);
create index idx_fechamentos_user_updated on fechamentos_mensais (user_id, updated_at);
create index idx_fechamentos_user_ano_mes on fechamentos_mensais (user_id, ano, mes);

alter table contas_consumo enable row level security;
alter table abastecimentos enable row level security;
alter table configuracoes enable row level security;
alter table fechamentos_mensais enable row level security;

create policy contas_consumo_select on contas_consumo for select to authenticated using (user_id=auth.uid());
create policy contas_consumo_insert on contas_consumo for insert to authenticated with check (user_id=auth.uid());
create policy contas_consumo_update on contas_consumo for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy contas_consumo_delete on contas_consumo for delete to authenticated using (user_id=auth.uid());
create policy abastecimentos_select on abastecimentos for select to authenticated using (user_id=auth.uid());
create policy abastecimentos_insert on abastecimentos for insert to authenticated with check (user_id=auth.uid());
create policy abastecimentos_update on abastecimentos for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy abastecimentos_delete on abastecimentos for delete to authenticated using (user_id=auth.uid());
create policy configuracoes_select on configuracoes for select to authenticated using (user_id=auth.uid());
create policy configuracoes_insert on configuracoes for insert to authenticated with check (user_id=auth.uid() and id=auth.uid());
create policy configuracoes_update on configuracoes for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid() and id=auth.uid());
create policy configuracoes_delete on configuracoes for delete to authenticated using (user_id=auth.uid());
create policy fechamentos_mensais_select on fechamentos_mensais for select to authenticated using (user_id=auth.uid());
create policy fechamentos_mensais_insert on fechamentos_mensais for insert to authenticated with check (user_id=auth.uid());
create policy fechamentos_mensais_update on fechamentos_mensais for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy fechamentos_mensais_delete on fechamentos_mensais for delete to authenticated using (user_id=auth.uid());

grant select,insert,update,delete on table contas_consumo,abastecimentos,configuracoes,fechamentos_mensais to authenticated;
revoke all on table contas_consumo,abastecimentos,configuracoes,fechamentos_mensais from anon;

create trigger trg_contas_consumo_updated_at before update on contas_consumo for each row execute function atualizar_updated_at();
create trigger trg_abastecimentos_updated_at before update on abastecimentos for each row execute function atualizar_updated_at();
create trigger trg_configuracoes_updated_at before update on configuracoes for each row execute function atualizar_updated_at();
create trigger trg_fechamentos_mensais_updated_at before update on fechamentos_mensais for each row execute function atualizar_updated_at();
