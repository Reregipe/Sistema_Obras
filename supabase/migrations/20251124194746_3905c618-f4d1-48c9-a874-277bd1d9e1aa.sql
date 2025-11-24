-- Habilitar realtime na tabela de histórico de roles
ALTER TABLE public.user_roles_history REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles_history;