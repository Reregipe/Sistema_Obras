-- Adiciona colunas para o motor de etapas e trigger para manter etapa_atual

-- Novas colunas (usamos IF NOT EXISTS para não quebrar se já criadas)
ALTER TABLE public.acionamentos
  ADD COLUMN IF NOT EXISTS etapa_atual integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data_execucao timestamptz,
  ADD COLUMN IF NOT EXISTS medicao_registrada_em timestamptz,
  ADD COLUMN IF NOT EXISTS os_criada_em timestamptz,
  ADD COLUMN IF NOT EXISTS book_enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS fiscal_enviado_em timestamptz,
  ADD COLUMN IF NOT EXISTS tci_criado_em timestamptz,
  ADD COLUMN IF NOT EXISTS medicao_enviada_em timestamptz,
  ADD COLUMN IF NOT EXISTS medicao_aprovada_em timestamptz,
  ADD COLUMN IF NOT EXISTS lote_gerado_em timestamptz,
  ADD COLUMN IF NOT EXISTS nf_emitida_em timestamptz,
  ADD COLUMN IF NOT EXISTS nf_numero text;

-- Função para calcular a etapa com base nos campos preenchidos
CREATE OR REPLACE FUNCTION public.fn_set_etapa_acionamento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  nova_etapa integer := 1;
BEGIN
  -- Ordem decrescente: do fim para o começo
  IF NEW.nf_emitida_em IS NOT NULL OR NULLIF(NEW.nf_numero, '') IS NOT NULL THEN
    nova_etapa := 10;
  ELSIF NEW.lote_gerado_em IS NOT NULL OR NEW.medicao_aprovada_em IS NOT NULL THEN
    nova_etapa := 9;
  ELSIF NEW.medicao_enviada_em IS NOT NULL THEN
    nova_etapa := 8;
  ELSIF NEW.tci_criado_em IS NOT NULL THEN
    nova_etapa := 7;
  ELSIF NEW.fiscal_enviado_em IS NOT NULL THEN
    nova_etapa := 6;
  ELSIF NEW.book_enviado_em IS NOT NULL THEN
    nova_etapa := 5;
  ELSIF NEW.os_criada_em IS NOT NULL OR NULLIF(NEW.numero_os, '') IS NOT NULL THEN
    nova_etapa := 4;
  ELSIF NEW.medicao_registrada_em IS NOT NULL THEN
    nova_etapa := 3;
  ELSIF NEW.data_execucao IS NOT NULL OR NEW.data_conclusao IS NOT NULL THEN
    nova_etapa := 2;
  ELSE
    nova_etapa := 1;
  END IF;

  NEW.etapa_atual := nova_etapa;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_etapa_acionamento ON public.acionamentos;
CREATE TRIGGER trg_set_etapa_acionamento
BEFORE INSERT OR UPDATE ON public.acionamentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_etapa_acionamento();

-- Recalcula etapas para registros existentes
UPDATE public.acionamentos
SET etapa_atual = etapa_atual;
