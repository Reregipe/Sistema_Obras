// Mock de dados para AcionamentoDetalhe
export const mockDossier = {
  acionamento: {
    id_acionamento: "123",
    codigo_acionamento: "105",
    municipio: "Cuiabá",
    modalidade: "LM + LV",
    prioridade: "alta",
    status: "Em Medição",
    valor_previsto: 12450,
    valor_aprovado: 11300,
    valor_retido: 1150,
    endereco: "Rua das Palmeiras, 1234 - Centro",
    encarregado: "João Silva",
    observacao: "Poste abalroado por veículo - necessário troca completa",
    data_abertura: "2026-01-08T08:00:00Z",
    data_despacho: "2026-01-08T08:30:00Z",
    data_conclusao: "2026-01-12T11:44:00Z",
    book_email_anexo_name: "book_acionamento_105.pdf",
    book_email_msg_name: "book_105_msg.eml",
    tci_numero: "15422",
    fiscal_enviado_em: "2026-01-12T15:00:00Z",
    assinatura_fiscal_em: "2026-01-12T16:30:00Z",
    assinatura_cliente_em: "2026-01-12T17:00:00Z",
    lote_gerado_em: "2026-01-14T09:00:00Z",
    nf_numero: "000124",
    nf_emitida_em: "2026-01-14T10:30:00Z"
  },
  execucao: {
    km_inicial: 12500,
    km_final: 12536,
    km_total: 36,
    saida_base: "07:12",
    inicio_servico: "08:03",
    retorno_servico: "11:20",
    retorno_base: "11:44",
    alimentador: "CBA-17",
    subestacao: "CPA",
    numero_transformador: "TRF-0045821",
    id_poste: "PST-112547",
    observacoes: "Serviço executado sem intercorrências. Cliente acompanhou."
  },
  medicaoOrcamento: {
    total_base_lm: 8500,
    total_base_lv: 3950,
    total_final_lm: 7800,
    total_final_lv: 3500
  },
  medicaoRetornoItems: [],
  materiaisAplicados: [],
  sucataItens: []
};
