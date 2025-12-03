-- Tabela para equipes adicionais em um acionamento
create table if not exists public.acionamento_equipes (
  id_acionamento_equipe uuid primary key default gen_random_uuid(),
  id_acionamento uuid not null references public.acionamentos(id_acionamento) on delete cascade,
  id_equipe uuid not null references public.equipes(id_equipe),
  encarregado_nome text,
  criado_em timestamptz default now(),
  criado_por uuid references public.usuarios(id_usuario)
);

alter table public.acionamento_equipes enable row level security;

-- Policies básicas para usuários autenticados (ajuste conforme necessidade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'acionamento_equipes_select_auth'
  ) THEN
    CREATE POLICY acionamento_equipes_select_auth
      ON public.acionamento_equipes
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND policyname = 'acionamento_equipes_modify_auth'
  ) THEN
    CREATE POLICY acionamento_equipes_modify_auth
      ON public.acionamento_equipes
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
