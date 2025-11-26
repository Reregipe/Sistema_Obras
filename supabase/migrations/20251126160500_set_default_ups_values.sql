-- Define valores padrão provisórios para UPS (Linha Morta e Linha Viva)

INSERT INTO public.system_settings (chave, valor, descricao, tipo)
VALUES ('ups_valor_lm', '150.00', 'Valor padrao da UPS - Linha Morta', 'number')
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor,
    descricao = EXCLUDED.descricao,
    tipo = EXCLUDED.tipo,
    atualizado_em = now();

INSERT INTO public.system_settings (chave, valor, descricao, tipo)
VALUES ('ups_valor_lv', '180.00', 'Valor padrao da UPS - Linha Viva', 'number')
ON CONFLICT (chave) DO UPDATE
SET valor = EXCLUDED.valor,
    descricao = EXCLUDED.descricao,
    tipo = EXCLUDED.tipo,
    atualizado_em = now();
