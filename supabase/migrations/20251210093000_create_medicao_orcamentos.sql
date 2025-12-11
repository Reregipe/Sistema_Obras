-- Medição / Orçamento - rascunho de mão de obra por acionamento
CREATE TABLE IF NOT EXISTS public.medicao_orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_acionamento UUID NOT NULL REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE,
  itens_lm JSONB NOT NULL DEFAULT '[]'::jsonb,
  itens_lv JSONB NOT NULL DEFAULT '[]'::jsonb,
  fora_horario BOOLEAN NOT NULL DEFAULT FALSE,
  valor_ups_lm NUMERIC(12,2),
  valor_ups_lv NUMERIC(12,2),
  total_base_lm NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_base_lv NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_final_lm NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_final_lv NUMERIC(14,2) NOT NULL DEFAULT 0,
  atualizado_por UUID REFERENCES auth.users(id),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT medicao_orcamentos_id_acionamento_key UNIQUE (id_acionamento)
);

COMMENT ON TABLE public.medicao_orcamentos IS 'Rascunho de mão de obra/medição por acionamento.';
COMMENT ON COLUMN public.medicao_orcamentos.itens_lm IS 'Itens LM salvos como rascunho (array JSON).';
COMMENT ON COLUMN public.medicao_orcamentos.itens_lv IS 'Itens LV salvos como rascunho (array JSON).';

CREATE INDEX IF NOT EXISTS idx_medicao_orcamentos_acionamento
  ON public.medicao_orcamentos (id_acionamento);

CREATE OR REPLACE FUNCTION public.set_medicao_orcamentos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_medicao_orcamentos_updated_at'
  ) THEN
    CREATE TRIGGER trg_medicao_orcamentos_updated_at
    BEFORE UPDATE ON public.medicao_orcamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.set_medicao_orcamentos_updated_at();
  END IF;
END $$;

ALTER TABLE public.medicao_orcamentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medicao_orcamentos'
      AND policyname = 'Medicao orcamentos leitura'
  ) THEN
    CREATE POLICY "Medicao orcamentos leitura"
      ON public.medicao_orcamentos
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medicao_orcamentos'
      AND policyname = 'Medicao orcamentos escrita'
  ) THEN
    CREATE POLICY "Medicao orcamentos escrita"
      ON public.medicao_orcamentos
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medicao_orcamentos'
      AND policyname = 'Medicao orcamentos atualizacao'
  ) THEN
    CREATE POLICY "Medicao orcamentos atualizacao"
      ON public.medicao_orcamentos
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'medicao_orcamentos'
      AND policyname = 'Medicao orcamentos exclusao'
  ) THEN
    CREATE POLICY "Medicao orcamentos exclusao"
      ON public.medicao_orcamentos
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
