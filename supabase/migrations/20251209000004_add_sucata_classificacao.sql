-- Migration: Adiciona coluna classificacao à tabela sucata_itens
-- Autor: Sistema_Obras
-- Data: 2025-12-09
-- Descrição: Classifica sucatas em SUCATA, REFORMA, BOM, DESCARTE

alter table public.sucata_itens
  add column if not exists classificacao text default 'SUCATA' check (classificacao in ('SUCATA', 'REFORMA', 'BOM', 'DESCARTE'));

-- Adiciona coluna de quantidade_retirada se não existir
alter table public.sucata_itens
  add column if not exists quantidade_retirada numeric(10, 2) default 0;

-- Comentários
comment on column public.sucata_itens.classificacao is 'Classificação do material retirado: SUCATA, REFORMA, BOM ou DESCARTE';
comment on column public.sucata_itens.quantidade_retirada is 'Quantidade de material retirado';
