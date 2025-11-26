-- Adicionar campo de prioridade (nível) nos acionamentos
ALTER TABLE public.acionamentos
ADD COLUMN IF NOT EXISTS prioridade_nivel TEXT CHECK (prioridade_nivel IN ('normal', 'media', 'alta', 'emergencia')) DEFAULT 'media';
