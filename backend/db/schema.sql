-- SQLite schema gerado automaticamente a partir do inventário CSV
-- Tipos convertidos conforme regras fornecidas

CREATE TABLE acesso_nivel (
    id_nivel INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    criado_em TEXT
);

CREATE TABLE acionamento_equipes (
    id_acionamento_equipe TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    id_equipe TEXT NOT NULL,
    encarregado_nome TEXT,
    criado_em TEXT,
    criado_por TEXT,
    papel TEXT
);

CREATE TABLE acionamento_etapa_logs (
    id_log TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    etapa_anterior INTEGER,
    etapa_nova INTEGER,
    motivo TEXT,
    criado_em TEXT NOT NULL,
    criado_por TEXT
);

CREATE TABLE acionamento_eventos (
    id_evento TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    status_novo TEXT NOT NULL,
    motivo TEXT,
    timestamp TEXT NOT NULL,
    usuario TEXT NOT NULL
);

CREATE TABLE acionamento_execucao (
    id TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    km_inicial REAL,
    km_final REAL,
    km_total REAL,
    saida_base TEXT,
    inicio_servico TEXT,
    retorno_servico TEXT,
    retorno_base TEXT,
    troca_transformador INTEGER,
    trafo_ret_potencia TEXT,
    trafo_ret_marca TEXT,
    trafo_ret_ano TEXT,
    trafo_ret_tensao_secundaria TEXT,
    trafo_ret_tensao_primaria TEXT,
    trafo_ret_numero_serie TEXT,
    trafo_ret_patrimonio TEXT,
    trafo_inst_potencia TEXT,
    trafo_inst_marca TEXT,
    trafo_inst_ano TEXT,
    trafo_inst_tensao_secundaria TEXT,
    trafo_inst_tensao_primaria TEXT,
    trafo_inst_numero_serie TEXT,
    trafo_inst_patrimonio TEXT,
    tensao_an TEXT,
    tensao_bn TEXT,
    tensao_cn TEXT,
    tensao_ab TEXT,
    tensao_bc TEXT,
    tensao_ca TEXT,
    alimentador TEXT,
    subestacao TEXT,
    numero_transformador TEXT,
    id_poste TEXT,
    os_tablet TEXT,
    ss_nota TEXT,
    numero_intervencao TEXT,
    observacoes TEXT,
    criado_em TEXT,
    atualizado_em TEXT
);

CREATE TABLE acionamentos (
    id_acionamento TEXT PRIMARY KEY,
    origem TEXT NOT NULL,
    codigo_acionamento TEXT NOT NULL,
    numero_os TEXT,
    modalidade TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    municipio TEXT,
    endereco TEXT,
    data_abertura TEXT NOT NULL,
    data_despacho TEXT,
    data_chegada TEXT,
    data_conclusao TEXT,
    id_equipe TEXT,
    id_viatura TEXT,
    status TEXT NOT NULL,
    criado_por TEXT,
    criado_em TEXT,
    prioridade_nivel TEXT,
    encarregado TEXT,
    elemento_id TEXT,
    tipo_atividade TEXT,
    observacao TEXT,
    email_msg TEXT,
    etapa_atual INTEGER,
    data_execucao TEXT,
    medicao_registrada_em TEXT,
    os_criada_em TEXT,
    book_enviado_em TEXT,
    fiscal_enviado_em TEXT,
    tci_criado_em TEXT,
    medicao_enviada_em TEXT,
    medicao_aprovada_em TEXT,
    lote_gerado_em TEXT,
    nf_emitida_em TEXT,
    nf_numero TEXT,
    almox_conferido_em TEXT,
    almox_conferido_por TEXT,
    etapa_manual INTEGER,
    pre_lista_validada_em TEXT,
    materiais_consumidos_em TEXT,
    sucatas_enviadas_em TEXT,
    execucao_finalizada_em TEXT,
    assinatura_lider_equipe_em TEXT,
    assinatura_fiscal_em TEXT,
    assinatura_cliente_em TEXT,
    numero_obra TEXT,
    numero_obra_atualizado_em TEXT,
    os_email_anexo_path TEXT,
    os_email_anexo_nome TEXT,
    book_email_anexo_path TEXT,
    book_email_anexo_nome TEXT,
    book_email_msg TEXT,
    book_email_msg_name TEXT,
    tci_numero TEXT,
    medicao_aprovacao_status TEXT
);

CREATE TABLE codigos_mao_de_obra (
    codigo_mao_de_obra TEXT PRIMARY KEY,
    operacao TEXT NOT NULL,
    descricao TEXT,
    unidade TEXT,
    ups REAL,
    ativo INTEGER,
    tipo TEXT NOT NULL,
    raw_line TEXT,
    created_at TEXT
);

CREATE TABLE codigos_mo (
    codigo_mao_de_obra TEXT PRIMARY KEY,
    operacao TEXT NOT NULL,
    descricao TEXT,
    unidade TEXT,
    ups REAL,
    tipo TEXT,
    ativo TEXT
);

CREATE TABLE equipe_membros (
    id_equipe TEXT NOT NULL,
    user_id TEXT NOT NULL,
    papel TEXT,
    criado_em TEXT
);

CREATE TABLE equipes (
    id_equipe TEXT PRIMARY KEY,
    nome_equipe TEXT NOT NULL,
    ativo TEXT NOT NULL,
    encarregado_nome TEXT,
    encarregado_telefone TEXT,
    linha TEXT
);

CREATE TABLE invites (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    roles TEXT NOT NULL,
    convidado_por TEXT NOT NULL,
    criado_em TEXT,
    expira_em TEXT NOT NULL,
    aceito_em TEXT,
    status TEXT NOT NULL
);

CREATE TABLE lista_aplicacao_cabecalho (
    id_lista_aplicacao TEXT PRIMARY KEY,
    observacao TEXT,
    id_acionamento TEXT,
    criado_em TEXT,
    criado_por TEXT,
    atualizado_em TEXT,
    atualizado_por TEXT
);

CREATE TABLE lista_aplicacao_itens (
    id_lista_aplicacao_item TEXT PRIMARY KEY,
    id_lista_aplicacao TEXT,
    ordem_item INTEGER,
    codigo_material TEXT NOT NULL,
    descricao_item TEXT NOT NULL,
    unidade_medida TEXT NOT NULL,
    quantidade REAL NOT NULL,
    criado_em TEXT,
    atualizado_em TEXT,
    criado_por TEXT,
    atualizado_por TEXT,
    removido_em TEXT,
    removido_por TEXT,
    id_acionamento TEXT,
    valor_unitario_upr REAL,
    valor_total REAL
);

CREATE TABLE materiais (
    codigo_material TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    unidade_medida TEXT NOT NULL,
    ativo TEXT
);

CREATE TABLE medicao_aprovacao_logs (
    id_log TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    status TEXT NOT NULL,
    observacao TEXT,
    criado_em TEXT NOT NULL
);

CREATE TABLE medicao_orcamentos (
    id TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    itens_lm TEXT NOT NULL,
    itens_lv TEXT NOT NULL,
    fora_horario INTEGER NOT NULL,
    valor_ups_lm REAL,
    valor_ups_lv REAL,
    total_base_lm REAL NOT NULL,
    total_base_lv REAL NOT NULL,
    total_final_lm REAL NOT NULL,
    total_final_lv REAL NOT NULL,
    atualizado_por TEXT,
    atualizado_em TEXT
);

CREATE TABLE medicao_retorno_items (
    id TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    origem TEXT NOT NULL,
    modalidade TEXT NOT NULL,
    codigo TEXT NOT NULL,
    descricao TEXT,
    quantidade REAL NOT NULL,
    ups REAL NOT NULL,
    total_valor REAL NOT NULL,
    regra_aplicada TEXT,
    lote_retorno_id TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE notificacoes (
    id_notificacao TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    etapa TEXT,
    referencia_id TEXT,
    referencia_tipo TEXT,
    lida INTEGER,
    criado_em TEXT,
    usuario_id TEXT
);

CREATE TABLE obras (
    id_obra TEXT PRIMARY KEY,
    modalidade TEXT NOT NULL,
    numero_os TEXT NOT NULL,
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
    saida_base TEXT,
    retorno_base TEXT,
    inicio_servico TEXT,
    retorno_servico TEXT,
    km_inicial REAL,
    km_final REAL,
    subestacao TEXT,
    numero_transformador TEXT,
    observacao TEXT,
    os_numero TEXT NOT NULL,
    os_data_abertura TEXT NOT NULL,
    os_data_envio_energisa TEXT NOT NULL,
    os_prazo_abertura_energisa INTEGER,
    os_data_aberta_pela_energisa TEXT,
    os_status TEXT NOT NULL,
    tci_numero TEXT,
    tci_data_emissao TEXT,
    tci_status TEXT,
    gestor_aprovacao_status TEXT,
    gestor_aprovacao_data TEXT,
    gestor_observacao TEXT,
    criado_em TEXT
);

CREATE TABLE pre_lista_itens (
    id TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    codigo_material TEXT NOT NULL,
    quantidade_prevista REAL NOT NULL,
    criado_em TEXT
);

CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    avatar_url TEXT,
    criado_em TEXT,
    atualizado_em TEXT
);

CREATE TABLE sucata_itens (
    id TEXT PRIMARY KEY,
    id_acionamento TEXT NOT NULL,
    codigo_material TEXT NOT NULL,
    quantidade_retirada REAL NOT NULL,
    criado_em TEXT,
    classificacao TEXT
);

CREATE TABLE system_settings (
    id TEXT PRIMARY KEY,
    chave TEXT NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL,
    atualizado_em TEXT,
    atualizado_por TEXT
);

CREATE TABLE user_roles (
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT,
    concedido_por TEXT
);

CREATE TABLE user_roles_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    acao TEXT NOT NULL,
    concedido_por TEXT,
    criado_em TEXT,
    motivo TEXT
);

CREATE TABLE usuario_acesso (
    id_usuario TEXT NOT NULL,
    id_nivel INTEGER NOT NULL,
    concedido_por TEXT,
    concedido_em TEXT NOT NULL
);

CREATE TABLE usuarios (
    id_usuario TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL,
    email_empresa TEXT NOT NULL,
    telefone TEXT,
    ativo TEXT NOT NULL,
    criado_em TEXT,
    observacao TEXT,
    pode_alterar_acionamento INTEGER
);
