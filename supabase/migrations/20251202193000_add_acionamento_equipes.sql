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
create policy if not exists acionamento_equipes_select_auth
  on public.acionamento_equipes
  for select
  to authenticated
  using (true);

create policy if not exists acionamento_equipes_modify_auth
  on public.acionamento_equipes
  for all
  to authenticated
  using (true)
  with check (true);
