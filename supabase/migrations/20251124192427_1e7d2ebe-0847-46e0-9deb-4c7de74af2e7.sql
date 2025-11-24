-- Atualizar políticas RLS para permitir todas as operações

-- Materiais
DROP POLICY IF EXISTS "Materiais visíveis" ON public.materiais;
CREATE POLICY "Usuários podem gerenciar materiais" ON public.materiais
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Códigos MO
DROP POLICY IF EXISTS "Códigos MO visíveis" ON public.codigos_mao_de_obra;
CREATE POLICY "Usuários podem gerenciar códigos MO" ON public.codigos_mao_de_obra
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Equipes
DROP POLICY IF EXISTS "Equipes visíveis" ON public.equipes;
CREATE POLICY "Usuários podem gerenciar equipes" ON public.equipes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Viaturas
DROP POLICY IF EXISTS "Viaturas visíveis" ON public.viaturas;
CREATE POLICY "Usuários podem gerenciar viaturas" ON public.viaturas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Parâmetros UPR
DROP POLICY IF EXISTS "Parâmetros UPR visíveis" ON public.parametros_upr;
CREATE POLICY "Usuários podem gerenciar parâmetros UPR" ON public.parametros_upr
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Usuários
DROP POLICY IF EXISTS "Usuários podem ver todos os registros" ON public.usuarios;
CREATE POLICY "Usuários podem gerenciar usuários" ON public.usuarios
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id_notificacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('urgente', 'atrasado', 'info', 'alerta')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  etapa TEXT,
  referencia_id UUID,
  referencia_tipo TEXT,
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT now(),
  usuario_id UUID
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações" ON public.notificacoes
  FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR usuario_id IS NULL);

CREATE POLICY "Sistema pode criar notificações" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários podem marcar notificações como lidas" ON public.notificacoes
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid() OR usuario_id IS NULL);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_criado_em ON public.notificacoes(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_acionamentos_status ON public.acionamentos(status);
CREATE INDEX IF NOT EXISTS idx_obras_os_status ON public.obras(os_status);

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;