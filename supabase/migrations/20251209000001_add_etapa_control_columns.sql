-- Migration: Adiciona colunas de controle de etapas
-- Autor: Sistema_Obras
-- Data: 2025-12-09

-- Adiciona colunas de timestamp para controle de avanço de etapas
alter table public.acionamentos
  add column if not exists pre_lista_validada_em timestamptz,
  add column if not exists materiais_consumidos_em timestamptz,
  add column if not exists sucatas_enviadas_em timestamptz,
  add column if not exists execucao_finalizada_em timestamptz,
  add column if not exists assinatura_lider_equipe_em timestamptz,
  add column if not exists assinatura_fiscal_em timestamptz,
  add column if not exists assinatura_cliente_em timestamptz;

-- Comentários explicativos
comment on column public.acionamentos.pre_lista_validada_em is 'Timestamp de validação da pré-lista (Etapa 1 → 2)';
comment on column public.acionamentos.materiais_consumidos_em is 'Timestamp de registro de consumo de materiais (Etapa 2 → 3, junto com sucatas_enviadas_em)';
comment on column public.acionamentos.sucatas_enviadas_em is 'Timestamp de registro de sucatas/descarte (Etapa 2 → 3, junto com materiais_consumidos_em)';
comment on column public.acionamentos.execucao_finalizada_em is 'Timestamp de finalização da execução (Etapa 3 → 4)';
comment on column public.acionamentos.assinatura_lider_equipe_em is 'Timestamp de assinatura do líder de equipe (Etapa 4 → 5)';
comment on column public.acionamentos.assinatura_fiscal_em is 'Timestamp de assinatura do fiscal (Etapa 5 → 6)';
comment on column public.acionamentos.assinatura_cliente_em is 'Timestamp de assinatura do cliente (Etapa 6 → 7)';
