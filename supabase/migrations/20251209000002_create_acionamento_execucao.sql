-- Migration: Cria tabela acionamento_execucao
-- Autor: Sistema_Obras
-- Data: 2025-12-09
-- Descrição: Armazena dados de execução do acionamento (transformadores, KM, horários)

create table if not exists public.acionamento_execucao (
  id uuid primary key default gen_random_uuid(),
  id_acionamento uuid not null unique references public.acionamentos(id) on delete cascade,
  
  -- Dados de saída/retorno
  saida_base timestamptz,
  retorno_base timestamptz,
  inicio_servico timestamptz,
  retorno_servico timestamptz,
  
  -- Quilometragem
  km_inicial text,
  km_final text,
  km_total text,
  
  -- Transformador retirado
  trafo_ret_potencia text,
  trafo_ret_marca text,
  trafo_ret_ano text,
  trafo_ret_numero_serie text,
  trafo_ret_tensao_primaria text,
  trafo_ret_tensao_secundaria text,
  
  -- Transformador instalado
  trafo_inst_potencia text,
  trafo_inst_marca text,
  trafo_inst_ano text,
  trafo_inst_numero_serie text,
  trafo_inst_tensao_primaria text,
  trafo_inst_tensao_secundaria text,
  
  -- Informações adicionais
  numero_intervencao text,
  ss_nota text,
  os_tablet text,
  
  -- Auditoria
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  criado_por uuid references public.usuarios(id),
  
  constraint fk_acionamento_execucao_acionamento foreign key (id_acionamento) references public.acionamentos(id)
);

-- Índices
create index idx_acionamento_execucao_id_acionamento on public.acionamento_execucao(id_acionamento);

-- Comentários
comment on table public.acionamento_execucao is 'Dados de execução do acionamento (transformadores, quilometragem, horários)';
comment on column public.acionamento_execucao.id_acionamento is 'Referência ao acionamento';
comment on column public.acionamento_execucao.trafo_ret_potencia is 'Potência do transformador retirado';
comment on column public.acionamento_execucao.trafo_inst_potencia is 'Potência do transformador instalado';

-- RLS (Row Level Security)
alter table public.acionamento_execucao enable row level security;

create policy "Users can view acionamento_execucao"
  on public.acionamento_execucao for select
  using (true);

create policy "Users can insert acionamento_execucao"
  on public.acionamento_execucao for insert
  with check (true);

create policy "Users can update acionamento_execucao"
  on public.acionamento_execucao for update
  using (true)
  with check (true);

create policy "Users can delete acionamento_execucao"
  on public.acionamento_execucao for delete
  using (true);
