// Supabase removido

export type MedicaoStatus = "SEM_MEDICAO" | "SEM_RETORNO" | "APROVADO" | "REPROVADO" | "ERRO_MEDICAO";

export type MedicaoData = {
  retornoResumo: {
    totalPrevisto: number;
    totalAprovado: number;
    totalRetido: number;
    percentualAprovacao: number;
    status: MedicaoStatus;
    errorMessage?: string;
  };
  maoDeObra: Array<{
    codigo: string;
    descricao?: string;
    qtdeEnviada?: number;
    qtdeAprovada?: number;
    valorEnviado?: number;
    valorAprovado?: number;
  }>;
  materiaisAplicados: Array<{
    codigo_material: string;
    descricao?: string;
    unidade_medida?: string;
    quantidade: number;
  }>;
  materiaisRetirados: Array<{
    codigo_material: string;
    descricao?: string;
    quantidade: number;
    classificacao?: string;
  }>;
};

const DEFAULT_RESULT: MedicaoData = {
  retornoResumo: {
    totalPrevisto: 0,
    totalAprovado: 0,
    totalRetido: 0,
    percentualAprovacao: 0,
    status: "SEM_MEDICAO",
  },
  maoDeObra: [],
  materiaisAplicados: [],
  materiaisRetirados: [],
};

const roundCurrency = (value: number) => Number(value.toFixed(2));

const buildStatus = (previsto: number, aprovado: number): MedicaoStatus => {
  if (previsto === 0) return "SEM_MEDICAO";
  if (aprovado === 0) return "SEM_RETORNO";
  const percentual = (aprovado / previsto) * 100;
  if (percentual >= 95) return "APROVADO";
  if (percentual < 80) return "REPROVADO";
  return "REPROVADO";
};

export async function loadMedicaoData(idAcionamento: string): Promise<MedicaoData> {
  if (!idAcionamento) return DEFAULT_RESULT;

  // Supabase removido: Retorne dados default
  return DEFAULT_RESULT;
}
