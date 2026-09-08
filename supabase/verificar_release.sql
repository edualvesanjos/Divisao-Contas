-- =========================================================
-- Verificação pré-release — Contas & Combustível v0.8.6
-- Execute no Supabase DEV e PROD antes de fechar/publicar uma release.
-- Este script é SOMENTE leitura.
-- =========================================================

-- 1) Colunas obrigatórias usadas pelo frontend atual
with required(table_name, column_name) as (
  values
    ('contas_consumo','id'),
    ('contas_consumo','user_id'),
    ('contas_consumo','tipo'),
    ('contas_consumo','valor_total'),
    ('contas_consumo','valor_rateado'),
    ('contas_consumo','numero_participantes'),
    ('contas_consumo','competencia'),
    ('contas_consumo','origem_importacao'),

    ('abastecimentos','id'),
    ('abastecimentos','user_id'),
    ('abastecimentos','data'),
    ('abastecimentos','valor_total'),
    ('abastecimentos','valor_rateado'),
    ('abastecimentos','percentual_rateado'),
    ('abastecimentos','litros'),
    ('abastecimentos','posto'),
    ('abastecimentos','tipo_combustivel'),
    ('abastecimentos','origem_importacao'),

    ('configuracoes','id'),
    ('configuracoes','user_id'),
    ('configuracoes','numero_participantes_padrao'),
    ('configuracoes','percentual_combustivel_padrao'),
    ('configuracoes','postos_gerenciados'),

    ('fechamentos_mensais','id'),
    ('fechamentos_mensais','user_id'),
    ('fechamentos_mensais','ano'),
    ('fechamentos_mensais','mes'),
    ('fechamentos_mensais','contas_pago'),
    ('fechamentos_mensais','contas_data_pagamento'),
    ('fechamentos_mensais','contas_data_rateio'),
    ('fechamentos_mensais','combustivel_data_rateio'),
    ('fechamentos_mensais','origem_importacao')
),
existing as (
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
)
select
  r.table_name,
  r.column_name,
  case when e.column_name is not null then 'OK' else 'AUSENTE' end as status
from required r
left join existing e
  on e.table_name = r.table_name
 and e.column_name = r.column_name
order by r.table_name, r.column_name;

-- 2) RLS: todas as quatro tabelas devem retornar rowsecurity = true
select
  relname as tabela,
  relrowsecurity as rls_ativo
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'contas_consumo',
    'abastecimentos',
    'configuracoes',
    'fechamentos_mensais'
  )
order by relname;

-- 3) Políticas existentes por tabela
select
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'contas_consumo',
    'abastecimentos',
    'configuracoes',
    'fechamentos_mensais'
  )
order by tablename, policyname;

-- 4) Constraint de tipos de conta:
-- deve incluir agua, luz, internet e mercado_livre.
select
  conname,
  pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.contas_consumo'::regclass
  and conname = 'contas_consumo_tipo_check';

-- 5) Constraint de tipo de combustível:
-- deve aceitar gasolina e etanol.
select
  conname,
  pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.abastecimentos'::regclass
  and pg_get_constraintdef(oid) ilike '%tipo_combustivel%';

-- 6) Contagem operacional (não altera dados)
select 'contas_consumo' as tabela, count(*) as registros from public.contas_consumo
union all
select 'abastecimentos', count(*) from public.abastecimentos
union all
select 'configuracoes', count(*) from public.configuracoes
union all
select 'fechamentos_mensais', count(*) from public.fechamentos_mensais;
