-- Ajusta a constraint de status dos acionamentos para comportar novos valores
ALTER TABLE public.acionamentos ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.acionamentos
  DROP CONSTRAINT IF EXISTS acionamentos_status_check;

ALTER TABLE public.acionamentos
  ADD CONSTRAINT acionamentos_status_check
  CHECK (status IN (
    'aberto', 'despachado', 'em_execucao', 'concluido', 'cancelado',
    'programado', 'em_andamento', 'pendente'
  ));

ALTER TABLE public.acionamentos ALTER COLUMN status SET DEFAULT 'pendente';
