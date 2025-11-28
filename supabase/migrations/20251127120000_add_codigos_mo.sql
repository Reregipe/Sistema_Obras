-- Tabela de códigos de mão de obra (com PK composta)
create table if not exists public.codigos_mo (
  codigo_mao_de_obra text not null,
  operacao text not null,
  descricao text,
  unidade text,
  ups numeric,
  tipo text,
  ativo bpchar default 'S',
  constraint codigos_mo_pkey primary key (codigo_mao_de_obra, operacao)
);

alter table public.codigos_mo enable row level security;

-- Policies
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'codigos_mo' and policyname = 'codigos_mo_select_all'
  ) then
    create policy codigos_mo_select_all
    on public.codigos_mo for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'codigos_mo' and policyname = 'codigos_mo_write_admin'
  ) then
    create policy codigos_mo_write_admin
    on public.codigos_mo for all
    to authenticated
    using (is_admin(auth.uid()))
    with check (is_admin(auth.uid()));
  end if;
end $$;
