-- Adiciona campos para elemento/ID, tipo da atividade e observacao em acionamentos
ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS elemento_id text;

ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS tipo_atividade text;

ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS observacao text;
