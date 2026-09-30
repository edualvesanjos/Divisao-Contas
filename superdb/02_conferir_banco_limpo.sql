-- Contas & Combustíveis v0.9.5 DEV
-- Conferência compatível com o Editor SQL do SuperDB (sem schemas de sistema).

select 'contas_consumo' as tabela, count(*) as registros from contas_consumo
union all select 'abastecimentos', count(*) from abastecimentos
union all select 'configuracoes', count(*) from configuracoes
union all select 'fechamentos_mensais', count(*) from fechamentos_mensais;

-- Em uma instalação nova, o resultado esperado é 0 nas quatro tabelas.
