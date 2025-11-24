-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  valor text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'text', -- text, number, boolean, date
  atualizado_em timestamp with time zone DEFAULT now(),
  atualizado_por uuid REFERENCES auth.users(id)
);

-- Inserir configurações padrão
INSERT INTO public.system_settings (chave, valor, descricao, tipo) VALUES
  ('prazo_abertura_energisa', '7', 'Prazo padrão em dias para abertura pela Energisa', 'number'),
  ('prazo_aprovacao_gestor', '3', 'Prazo padrão em dias para aprovação do gestor', 'number'),
  ('upr_valor_padrao', '150.00', 'Valor padrão da UPR', 'number'),
  ('email_notificacoes', 'true', 'Enviar notificações por email', 'boolean'),
  ('acionamento_urgente_prazo', '2', 'Prazo em horas para acionamentos urgentes', 'number')
ON CONFLICT (chave) DO NOTHING;

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  roles text[] NOT NULL DEFAULT '{}',
  convidado_por uuid REFERENCES auth.users(id) NOT NULL,
  criado_em timestamp with time zone DEFAULT now(),
  expira_em timestamp with time zone NOT NULL,
  aceito_em timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Criar tabela de histórico de mudanças de roles
CREATE TABLE IF NOT EXISTS public.user_roles_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  acao text NOT NULL CHECK (acao IN ('concedido', 'removido')),
  concedido_por uuid REFERENCES auth.users(id),
  criado_em timestamp with time zone DEFAULT now(),
  motivo text
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_history ENABLE ROW LEVEL SECURITY;

-- Políticas para system_settings
CREATE POLICY "Todos podem ver configurações"
  ON public.system_settings FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem atualizar configurações"
  ON public.system_settings FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Políticas para invites
CREATE POLICY "Admins podem gerenciar convites"
  ON public.invites FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Convites podem ser visualizados pelo token"
  ON public.invites FOR SELECT
  USING (true);

-- Políticas para user_roles_history
CREATE POLICY "Todos podem ver histórico de roles"
  ON public.user_roles_history FOR SELECT
  USING (true);

CREATE POLICY "Sistema pode inserir histórico"
  ON public.user_roles_history FOR INSERT
  WITH CHECK (true);

-- Trigger para registrar mudanças de roles
CREATE OR REPLACE FUNCTION public.log_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.user_roles_history (user_id, role, acao, concedido_por)
    VALUES (NEW.user_id, NEW.role, 'concedido', NEW.concedido_por);
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.user_roles_history (user_id, role, acao, concedido_por)
    VALUES (OLD.user_id, OLD.role, 'removido', auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER user_roles_audit_trigger
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_changes();

-- Trigger para atualizar timestamp de configurações
CREATE TRIGGER update_system_settings_timestamp
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();