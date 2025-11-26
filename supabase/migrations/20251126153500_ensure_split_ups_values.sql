-- Garante dois valores de UPS distintos (Linha Morta e Linha Viva)
-- e preserva valor legado caso ainda exista apenas a chave antiga.

-- Renomeia chave antiga apenas se ainda nao houve split
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.system_settings WHERE chave = 'upr_valor_padrao')
     AND NOT EXISTS (SELECT 1 FROM public.system_settings WHERE chave = 'ups_valor_lm') THEN
    UPDATE public.system_settings
    SET chave = 'ups_valor_lm',
        descricao = 'Valor padrao da UPS - Linha Morta',
        atualizado_em = now()
    WHERE chave = 'upr_valor_padrao';
  END IF;
END $$;

-- Insere valor para Linha Morta se nao existir
INSERT INTO public.system_settings (chave, valor, descricao, tipo)
SELECT
  'ups_valor_lm',
  COALESCE(
    (SELECT valor FROM public.system_settings WHERE chave = 'upr_valor_padrao' LIMIT 1),
    '0'
  ),
  'Valor padrao da UPS - Linha Morta',
  'number'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE chave = 'ups_valor_lm');

-- Insere valor para Linha Viva se nao existir
INSERT INTO public.system_settings (chave, valor, descricao, tipo)
SELECT
  'ups_valor_lv',
  COALESCE(
    (SELECT valor FROM public.system_settings WHERE chave = 'ups_valor_lm' LIMIT 1),
    (SELECT valor FROM public.system_settings WHERE chave = 'upr_valor_padrao' LIMIT 1),
    '0'
  ),
  'Valor padrao da UPS - Linha Viva',
  'number'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE chave = 'ups_valor_lv');

-- Anotacao no legado para evitar uso futuro
UPDATE public.system_settings
SET descricao = 'Legacy: utilize ups_valor_lm e ups_valor_lv'
WHERE chave = 'upr_valor_padrao';
