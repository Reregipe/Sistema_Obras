-- Atualiza chave UPR para UPS e separa por linha morta e linha viva

-- Renomeia a chave existente (se houver) para UPS linha morta
UPDATE public.system_settings
SET chave = 'ups_valor_lm',
    descricao = 'Valor padrao da UPS - Linha Morta',
    atualizado_em = now()
WHERE chave = 'upr_valor_padrao'
  AND NOT EXISTS (
    SELECT 1 FROM public.system_settings WHERE chave = 'ups_valor_lm'
  );

-- Insere UPS linha viva se nao existir
INSERT INTO public.system_settings (chave, valor, descricao, tipo)
VALUES ('ups_valor_lv', '0', 'Valor padrao da UPS - Linha Viva', 'number')
ON CONFLICT (chave) DO NOTHING;
