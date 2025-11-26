-- Seed de dados demo para o Sistema_Obras
-- Cria um usuario tecnico e popula 30 acionamentos + 10 obras cobrindo etapas do fluxo.

BEGIN;

-- Garante um usuario para referenciar nos acionamentos
WITH seeder AS (
  INSERT INTO public.usuarios (id_usuario, nome, cpf, email_empresa, telefone, observacao)
  VALUES (
    '11111111-2222-3333-4444-555555555555',
    'Usuario Demo',
    '99988877766',
    'demo.seed@engeletrica.local',
    '(65) 99999-0000',
    'Gerado automaticamente para popular dashboards'
  )
  ON CONFLICT (cpf) DO UPDATE
    SET nome = EXCLUDED.nome,
        email_empresa = EXCLUDED.email_empresa,
        telefone = EXCLUDED.telefone,
        observacao = EXCLUDED.observacao
  RETURNING id_usuario
),
u AS (
  SELECT id_usuario FROM seeder
  UNION ALL
  SELECT id_usuario FROM public.usuarios WHERE cpf = '99988877766'
)
INSERT INTO public.acionamentos (
  codigo_acionamento,
  origem,
  numero_os,
  modalidade,
  prioridade,
  municipio,
  endereco,
  data_abertura,
  data_despacho,
  data_chegada,
  data_conclusao,
  id_equipe,
  id_viatura,
  status,
  criado_por,
  criado_em
) 
SELECT
  'AC-DEMO-' || lpad(gs::text, 3, '0') AS codigo_acionamento,
  CASE WHEN gs % 2 = 0 THEN 'Call Center' ELSE 'E-mail Energisa' END AS origem,
  'OS-AC-' || lpad(gs::text, 4, '0') AS numero_os,
  CASE WHEN gs % 2 = 0 THEN 'LM' ELSE 'LV' END AS modalidade,
  CASE WHEN gs % 3 = 0 THEN 'emergencia' ELSE 'programado' END AS prioridade,
  CASE WHEN gs % 2 = 0 THEN 'Cuiaba' ELSE 'Varzea Grande' END AS municipio,
  'Endereco ' || gs AS endereco,
  now() - (gs || ' hours')::interval AS data_abertura,
  CASE WHEN gs % 4 IN (2,3) THEN now() - ((gs - 1) || ' hours')::interval END AS data_despacho,
  CASE WHEN gs % 4 = 3 THEN now() - ((gs - 2) || ' hours')::interval END AS data_chegada,
  CASE WHEN gs % 5 = 0 THEN now() - ((gs - 3) || ' hours')::interval END AS data_conclusao,
  NULL AS id_equipe,
  NULL AS id_viatura,
  CASE 
    WHEN gs % 6 = 0 THEN 'aberto'          -- emergencias sem equipe (urgentes)
    WHEN gs % 5 = 0 THEN 'concluido'
    WHEN gs % 4 = 0 THEN 'em_execucao'
    WHEN gs % 3 = 0 THEN 'despachado'
    WHEN gs % 2 = 0 THEN 'aberto'
    ELSE 'aberto'
  END AS status,
  (SELECT id_usuario FROM u LIMIT 1) AS criado_por,
  now() - (gs || ' hours')::interval AS criado_em
FROM generate_series(1, 30) AS gs;

-- Obras distribuidas pelas 10 etapas (status/TCI/aprovacao variados)
INSERT INTO public.obras (
  modalidade,
  numero_os,
  os_numero,
  codigo_acionamento,
  numero_intervencao,
  endereco,
  subestacao,
  os_data_abertura,
  os_data_envio_energisa,
  os_data_aberta_pela_energisa,
  os_status,
  gestor_aprovacao_status,
  gestor_aprovacao_data,
  gestor_observacao,
  tci_status,
  tci_data_emissao,
  tci_numero,
  observacao,
  criado_em
) VALUES
  ('LM', 'OS-DEMO-101', 'OS-DEMO-101', 'AC-DEMO-001', 'INT-101', 'Rua A, 100', 'Subestacao Sul', now() - interval '9 days', now() - interval '8 days', NULL, 'gerada', NULL, NULL, 'Etapa 1 - acionamento recebido', 'pendente', NULL, NULL, 'Preparando book inicial', now() - interval '9 days'),
  ('LV', 'OS-DEMO-102', 'OS-DEMO-102', 'AC-DEMO-004', 'INT-102', 'Rua B, 200', 'Subestacao Norte', now() - interval '8 days', now() - interval '7 days', NULL, 'aberta', 'aguardando', now() - interval '6 days', 'Medicao em validacao', 'pendente', NULL, NULL, 'Etapa 2 - execucao em campo', now() - interval '8 days'),
  ('LM', 'OS-DEMO-103', 'OS-DEMO-103', 'AC-DEMO-007', 'INT-103', 'Rua C, 300', 'Subestacao Leste', now() - interval '7 days', now() - interval '1 days', NULL, 'enviada', NULL, NULL, 'Documentacao enviada', 'pendente', NULL, NULL, 'Etapa 3 - medicao concluida', now() - interval '7 days'),
  ('LV', 'OS-DEMO-104', 'OS-DEMO-104', 'AC-DEMO-010', 'INT-104', 'Rua D, 400', 'Subestacao Oeste', now() - interval '12 days', now() - interval '10 days', NULL, 'enviada', NULL, NULL, 'Prazo estourado Energisa', 'pendente', NULL, NULL, 'Etapa 4 - aguardando Energisa', now() - interval '12 days'),
  ('LM', 'OS-DEMO-105', 'OS-DEMO-105', 'AC-DEMO-013', 'INT-105', 'Rua E, 500', 'Subestacao Sul', now() - interval '6 days', now() - interval '5 days', NULL, 'enviada', 'aguardando', now() - interval '4 days', 'Book em revisao fiscal', 'pendente', NULL, NULL, 'Etapa 5 - book enviado', now() - interval '6 days'),
  ('LV', 'OS-DEMO-106', 'OS-DEMO-106', 'AC-DEMO-016', 'INT-106', 'Rua F, 600', 'Subestacao Norte', now() - interval '5 days', now() - interval '5 days', now() - interval '2 days', 'aberta', 'aprovado', now() - interval '2 days', 'Aguardando TCI', 'emitido', now() - interval '2 days', 'TCI-106', 'Etapa 6 - aprovacao fiscal', now() - interval '5 days'),
  ('LM', 'OS-DEMO-107', 'OS-DEMO-107', 'AC-DEMO-019', 'INT-107', 'Rua G, 700', 'Subestacao Leste', now() - interval '4 days', now() - interval '4 days', NULL, 'enviada', 'aprovado', now() - interval '2 days', 'Liberada para TCI', 'emitido', now() - interval '1 days', 'TCI-107', 'Etapa 7 - TCI emitido', now() - interval '4 days'),
  ('LV', 'OS-DEMO-108', 'OS-DEMO-108', 'AC-DEMO-022', 'INT-108', 'Rua H, 800', 'Subestacao Oeste', now() - interval '3 days', now() - interval '3 days', NULL, 'aberta', 'aguardando', now() - interval '2 days', 'Gestor revisando medicoes', 'pendente', NULL, NULL, 'Etapa 8 - aprovacao gestor', now() - interval '3 days'),
  ('LM', 'OS-DEMO-109', 'OS-DEMO-109', 'AC-DEMO-025', 'INT-109', 'Rua I, 900', 'Subestacao Sul', now() - interval '2 days', now() - interval '8 days', NULL, 'enviada', 'aprovado', now() - interval '1 days', 'Aguardando lote', 'validado', now() - interval '1 days', 'TCI-109', 'Etapa 9 - aguardando lote', now() - interval '2 days'),
  ('LV', 'OS-DEMO-110', 'OS-DEMO-110', 'AC-DEMO-028', 'INT-110', 'Rua J, 1000', 'Subestacao Norte', now() - interval '1 days', now() - interval '1 days', now(), 'aberta', 'aprovado', now(), 'Pronta para NF', 'validado', now(), 'TCI-110', 'Etapa 10 - pronta para faturar', now() - interval '1 days');

COMMIT;
