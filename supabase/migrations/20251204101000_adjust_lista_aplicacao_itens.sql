-- Permitir uso de lista_aplicacao_itens por id_acionamento sem cabeçalho obrigatório
ALTER TABLE public.lista_aplicacao_itens
  ALTER COLUMN id_lista_aplicacao DROP NOT NULL;
