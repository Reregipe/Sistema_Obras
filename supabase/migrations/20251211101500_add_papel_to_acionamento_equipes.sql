-- Adiciona a coluna "papel" na tabela acionamento_equipes
-- Data: 2025-12-11
-- Motivo: Registrar se a equipe atua como LM ou LV diretamente no acionamento

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'acionamento_equipes'
       AND column_name = 'papel'
  ) THEN
    ALTER TABLE public.acionamento_equipes
      ADD COLUMN papel text;
  END IF;
END $$;

COMMENT ON COLUMN public.acionamento_equipes.papel IS 'Tipo de atuação da equipe dentro do acionamento (LM, LV, etc)';
