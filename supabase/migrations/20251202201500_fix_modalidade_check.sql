-- Ajusta constraint de modalidade para permitir LM, LV e LM+LV
alter table public.acionamentos
  drop constraint if exists acionamentos_modalidade_check;

alter table public.acionamentos
  add constraint acionamentos_modalidade_check
  check (modalidade in ('LM', 'LV', 'LM+LV'));

