-- Adiciona campo encarregado (texto) aos acionamentos
ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS encarregado text;
