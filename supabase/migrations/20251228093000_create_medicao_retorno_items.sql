-- Create table for concessionaria return items used by the auditing modal
CREATE TABLE IF NOT EXISTS public.medicao_retorno_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_acionamento UUID NOT NULL REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE,
  origem TEXT NOT NULL CHECK (origem IN ('ENVIADO','APROVADO')),
  modalidade TEXT NOT NULL CHECK (modalidade IN ('LM','LV')),
  codigo TEXT NOT NULL,
  descricao TEXT,
  quantidade NUMERIC(14,4) NOT NULL DEFAULT 0,
  ups NUMERIC(14,4) NOT NULL DEFAULT 0,
  total_valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  regra_aplicada TEXT,
  lote_retorno_id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medicao_retorno_items_acionamento_idx ON public.medicao_retorno_items (id_acionamento);
