-- Migration: Adiciona coluna almox_conferido_em à tabela acionamentos
-- Autor: Sistema_Obras
-- Data: 2025-12-09
-- Descrição: Registra quando o almoxarife conferiu o acionamento

alter table public.acionamentos
  add column if not exists almox_conferido_em timestamptz;

-- Comentários
comment on column public.acionamentos.almox_conferido_em is 'Timestamp de conferência do almoxarife';
