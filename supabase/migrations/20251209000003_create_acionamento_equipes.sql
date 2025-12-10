-- Migration: Cria tabela acionamento_equipes
-- Autor: Sistema_Obras
-- Data: 2025-12-09
-- Descrição: Relação muitos-para-muitos entre acionamentos e equipes

create table if not exists public.acionamento_equipes (
  id uuid primary key default gen_random_uuid(),
  id_acionamento uuid not null references public.acionamentos(id) on delete cascade,
  id_equipe uuid not null references public.equipes(id) on delete cascade,
  
  -- Papéis/funções da equipe no acionamento
  papel text, -- 'lider', 'eletricista', 'ajudante', etc
  
  -- Auditoria
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  criado_por uuid references public.usuarios(id),
  
  unique(id_acionamento, id_equipe)
);

-- Índices
create index idx_acionamento_equipes_id_acionamento on public.acionamento_equipes(id_acionamento);
create index idx_acionamento_equipes_id_equipe on public.acionamento_equipes(id_equipe);

-- Comentários
comment on table public.acionamento_equipes is 'Associação entre acionamentos e equipes que trabalham neles';
comment on column public.acionamento_equipes.papel is 'Papel da equipe no acionamento (líder, técnico, ajudante, etc)';

-- RLS (Row Level Security)
alter table public.acionamento_equipes enable row level security;

create policy "Users can view acionamento_equipes"
  on public.acionamento_equipes for select
  using (true);

create policy "Users can insert acionamento_equipes"
  on public.acionamento_equipes for insert
  with check (true);

create policy "Users can update acionamento_equipes"
  on public.acionamento_equipes for update
  using (true)
  with check (true);

create policy "Users can delete acionamento_equipes"
  on public.acionamento_equipes for delete
  using (true);
