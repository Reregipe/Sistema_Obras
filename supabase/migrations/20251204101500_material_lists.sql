-- Tabelas simplificadas por acionamento

-- Pré-lista (Etapa 1)
CREATE TABLE IF NOT EXISTS public.pre_lista_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_acionamento UUID NOT NULL REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE,
  codigo_material TEXT NOT NULL REFERENCES public.materiais(codigo_material),
  quantidade_prevista DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Sucata (Etapa 2)
CREATE TABLE IF NOT EXISTS public.sucata_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_acionamento UUID NOT NULL REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE,
  codigo_material TEXT NOT NULL REFERENCES public.materiais(codigo_material),
  quantidade_retirada DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Ajustar lista_aplicacao_itens para aceitar id_acionamento
ALTER TABLE public.lista_aplicacao_itens
  ADD COLUMN IF NOT EXISTS id_acionamento UUID REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE;

-- RLS
ALTER TABLE public.pre_lista_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucata_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Pre-lista visivel" ON public.pre_lista_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Sucata visivel" ON public.sucata_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
