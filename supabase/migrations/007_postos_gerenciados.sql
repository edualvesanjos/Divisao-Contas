-- =========================================================
-- Migração 007 — Gerenciador de Postos (v0.8.3.1)
-- Execute no ambiente DEV antes de testar o gerenciamento.
-- =========================================================

alter table public.configuracoes
  add column if not exists postos_gerenciados jsonb;

comment on column public.configuracoes.postos_gerenciados is
  'Lista de postos exibida no cadastro. NULL = ainda não inicializada; [] = lista deliberadamente vazia.';
