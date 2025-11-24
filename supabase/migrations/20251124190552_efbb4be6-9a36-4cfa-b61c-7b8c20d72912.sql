-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf CHAR(11) NOT NULL UNIQUE,
  email_empresa TEXT NOT NULL UNIQUE,
  telefone TEXT,
  ativo CHAR(1) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S', 'N')),
  criado_em TIMESTAMPTZ DEFAULT now(),
  observacao TEXT
);

-- Criar tabela de níveis de acesso
CREATE TABLE IF NOT EXISTS public.acesso_nivel (
  id_nivel SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Inserir níveis de acesso padrão
INSERT INTO public.acesso_nivel (codigo, descricao) VALUES
  ('ADMIN', 'Administrador do Sistema'),
  ('ADM', 'Administrativo - OS/medição'),
  ('OPER', 'Operacional - Campo'),
  ('GESTOR', 'Gestor - Aprovações'),
  ('FIN', 'Financeiro - Faturamento')
ON CONFLICT (codigo) DO NOTHING;

-- Criar tabela de acesso de usuários
CREATE TABLE IF NOT EXISTS public.usuario_acesso (
  id_usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
  id_nivel INTEGER NOT NULL REFERENCES public.acesso_nivel(id_nivel) ON DELETE CASCADE,
  concedido_por UUID REFERENCES public.usuarios(id_usuario),
  concedido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_usuario, id_nivel)
);

-- Criar tabela de equipes
CREATE TABLE IF NOT EXISTS public.equipes (
  id_equipe UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_equipe TEXT NOT NULL,
  id_encarregado UUID NOT NULL REFERENCES public.usuarios(id_usuario),
  ativo CHAR(1) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

-- Criar tabela de viaturas
CREATE TABLE IF NOT EXISTS public.viaturas (
  id_viatura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT,
  apelido TEXT,
  ativo CHAR(1) NOT NULL DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

-- Criar tabela de parâmetros UPR
CREATE TABLE IF NOT EXISTS public.parametros_upr (
  id_param_upr UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato TEXT NOT NULL,
  valor_upr DECIMAL(10,4) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  observacao TEXT
);

-- Criar tabela de códigos de mão de obra (PADRÃO)
CREATE TABLE IF NOT EXISTS public.codigos_mao_de_obra (
  codigo_mao_de_obra TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  ups DECIMAL(10,2) NOT NULL,
  ativo CHAR(1) DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

-- Criar tabela de materiais (PADRÃO)
CREATE TABLE IF NOT EXISTS public.materiais (
  codigo_material TEXT PRIMARY KEY,
  descricao TEXT NOT NULL,
  unidade_medida TEXT NOT NULL,
  ativo CHAR(1) DEFAULT 'S' CHECK (ativo IN ('S', 'N'))
);

-- Criar tabela de acionamentos
CREATE TABLE IF NOT EXISTS public.acionamentos (
  id_acionamento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem TEXT NOT NULL,
  codigo_acionamento TEXT,
  numero_os TEXT,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('LM', 'LV')),
  prioridade TEXT NOT NULL CHECK (prioridade IN ('emergencia', 'programado')),
  municipio TEXT,
  endereco TEXT,
  data_abertura TIMESTAMPTZ NOT NULL,
  data_despacho TIMESTAMPTZ,
  data_chegada TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  id_equipe UUID REFERENCES public.equipes(id_equipe),
  id_viatura UUID REFERENCES public.viaturas(id_viatura),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'despachado', 'em_execucao', 'concluido', 'cancelado')),
  criado_por UUID NOT NULL REFERENCES public.usuarios(id_usuario),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de eventos de acionamentos
CREATE TABLE IF NOT EXISTS public.acionamento_eventos (
  id_evento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_acionamento UUID NOT NULL REFERENCES public.acionamentos(id_acionamento) ON DELETE CASCADE,
  status_novo TEXT NOT NULL,
  motivo TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario UUID NOT NULL REFERENCES public.usuarios(id_usuario)
);

-- Criar tabela de obras
CREATE TABLE IF NOT EXISTS public.obras (
  id_obra UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade TEXT NOT NULL CHECK (modalidade IN ('LM', 'LV')),
  numero_os TEXT NOT NULL UNIQUE,
  equipe TEXT,
  endereco TEXT,
  alimentador TEXT,
  id_poste TEXT,
  codigo_acionamento TEXT,
  numero_intervencao TEXT,
  nota_ss TEXT,
  os_tablet TEXT,
  encarregado TEXT,
  tecnico_eng TEXT,
  eletricistas_nr TEXT,
  saida_base TIMESTAMPTZ,
  retorno_base TIMESTAMPTZ,
  inicio_servico TIMESTAMPTZ,
  retorno_servico TIMESTAMPTZ,
  km_inicial DECIMAL(10,2),
  km_final DECIMAL(10,2),
  subestacao TEXT,
  numero_transformador TEXT,
  observacao TEXT,
  os_numero TEXT NOT NULL,
  os_data_abertura TIMESTAMPTZ NOT NULL,
  os_data_envio_energisa TIMESTAMPTZ NOT NULL,
  os_prazo_abertura_energisa INTEGER DEFAULT 7,
  os_data_aberta_pela_energisa TIMESTAMPTZ,
  os_status TEXT NOT NULL DEFAULT 'gerada' CHECK (os_status IN ('gerada', 'enviada', 'aberta', 'atrasada')),
  tci_numero TEXT,
  tci_data_emissao TIMESTAMPTZ,
  tci_status TEXT CHECK (tci_status IN ('pendente', 'emitido', 'validado')),
  gestor_aprovacao_status TEXT CHECK (gestor_aprovacao_status IN ('aguardando', 'aprovado', 'reprovado')),
  gestor_aprovacao_data TIMESTAMPTZ,
  gestor_observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de lista de aplicação (cabeçalho)
CREATE TABLE IF NOT EXISTS public.lista_aplicacao_cabecalho (
  id_lista_aplicacao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID NOT NULL REFERENCES public.obras(id_obra) ON DELETE CASCADE,
  numero_os TEXT NOT NULL,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('LM', 'LV')),
  data_emissao TIMESTAMPTZ NOT NULL,
  equipe TEXT,
  viatura TEXT,
  id_param_upr UUID NOT NULL REFERENCES public.parametros_upr(id_param_upr),
  upr_valor_usado DECIMAL(10,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'carregada', 'enviada', 'concluida')),
  observacao TEXT
);

-- Criar tabela de itens de lista de aplicação
CREATE TABLE IF NOT EXISTS public.lista_aplicacao_itens (
  id_lista_aplicacao_item UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_lista_aplicacao UUID NOT NULL REFERENCES public.lista_aplicacao_cabecalho(id_lista_aplicacao) ON DELETE CASCADE,
  ordem_item INTEGER,
  codigo_material TEXT NOT NULL REFERENCES public.materiais(codigo_material),
  descricao_item TEXT NOT NULL,
  unidade_medida TEXT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL,
  valor_unitario_upr DECIMAL(10,4) NOT NULL,
  valor_total DECIMAL(10,4) NOT NULL
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acesso_nivel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_upr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_mao_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acionamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acionamento_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_aplicacao_cabecalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_aplicacao_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir acesso autenticado)
CREATE POLICY "Usuários podem ver todos os registros" ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Níveis de acesso são públicos" ON public.acesso_nivel FOR SELECT TO authenticated USING (true);
CREATE POLICY "Acesso de usuários visível" ON public.usuario_acesso FOR SELECT TO authenticated USING (true);
CREATE POLICY "Equipes visíveis" ON public.equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Viaturas visíveis" ON public.viaturas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Parâmetros UPR visíveis" ON public.parametros_upr FOR SELECT TO authenticated USING (true);
CREATE POLICY "Códigos MO visíveis" ON public.codigos_mao_de_obra FOR SELECT TO authenticated USING (true);
CREATE POLICY "Materiais visíveis" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Acionamentos visíveis" ON public.acionamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Eventos visíveis" ON public.acionamento_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Obras visíveis" ON public.obras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Listas de aplicação visíveis" ON public.lista_aplicacao_cabecalho FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Itens de lista visíveis" ON public.lista_aplicacao_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);