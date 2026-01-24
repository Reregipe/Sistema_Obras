  idAcionamento?: string;
// src/types/OrcamentoPdfContext.ts

export interface OrcamentoPdfContext {
    numeroSs?: string;
    numeroSigod?: string;
    subestacaoTexto?: string;
    alimentadorTexto?: string;
    currentUserNameSnapshot?: string;
  id: string;
  pdfModalidade?: string;
  medicaoForaHC?: boolean;
  codigoAcionamento?: string;
  numeroIntervencaoTexto?: string;
  dataExecucaoTexto?: string;
  equipeTexto?: string;
  enderecoTexto?: string;
  alimentadorSubTexto?: string;
  itensMO?: any[];
  medicaoTab?: string;
  medicaoValorUpsLM?: number;
  medicaoValorUpsLV?: number;
  headerBase?: any;
  detalhesAcionamento?: any;
  dadosExec?: any;
  selectedItemSnapshot?: any;
  encarregadoTexto?: string;
  tecnicoTexto?: string;
  osTabletTexto?: string;
  consumo?: any[];
  sucata?: any[];
}
