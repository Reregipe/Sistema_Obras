import { supabase } from "@/integrations/supabase/client";

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

  try {
    const [{ data: orcamentos }, { data: retorno }, { data: consumos }, { data: sucata }] = await Promise.all([
      supabase
        .from("medicao_orcamentos")
        .select("codigo,descricao,quantidade,valor_previsto,valor_aprovado")
        .eq("id_acionamento", idAcionamento),
      supabase
        .from("medicao_retorno_items")
        .select("codigo,descricao,quantidade,valor_previsto,valor_aprovado")
        .eq("id_acionamento", idAcionamento),
      supabase
        .from("lista_aplicacao_itens")
        .select("codigo_material,descricao,unidade_medida,quantidade")
        .eq("id_acionamento", idAcionamento),
      supabase
        .from("sucata_itens")
        .select("codigo_material,descricao,quantidade,classificacao")
        .eq("id_acionamento", idAcionamento),
    ]);

    const maoDeObra: MedicaoData["maoDeObra"] = (retorno ?? []).map((item) => ({
      codigo: item.codigo,
      descricao: item.descricao || undefined,
      qtdeEnviada: Number(item.quantidade) || undefined,
      valorEnviado: Number(item.valor_previsto) || undefined,
      qtdeAprovada: Number(item.quantidade) || undefined,
      valorAprovado: Number(item.valor_aprovado) || undefined,
    }));

    const avalia = (lista: any[]) => {
      const previsto = lista.reduce((acc, item) => acc + Number(item.valor_previsto || 0), 0);
      const aprovado = lista.reduce((acc, item) => acc + Number(item.valor_aprovado || 0), 0);
      return { previsto, aprovado };
    };

    const { previsto, aprovado } = avalia(retorno || []);
    const totalRetido = previsto - aprovado;
    const percentual = previsto === 0 ? 0 : (aprovado / previsto) * 100;
    const status = buildStatus(previsto, aprovado);

    return {
      retornoResumo: {
        totalPrevisto: roundCurrency(previsto),
        totalAprovado: roundCurrency(aprovado),
        totalRetido: roundCurrency(totalRetido),
        percentualAprovacao: Number(percentual.toFixed(2)),
        status,
      },
      maoDeObra,
      materiaisAplicados: (consumos || []).map((item) => ({
        codigo_material: item.codigo_material,
        descricao: item.descricao || undefined,
        unidade_medida: item.unidade_medida || undefined,
        quantidade: Number(item.quantidade) || 0,
      })),
      materiaisRetirados: (sucata || []).map((item) => ({
        codigo_material: item.codigo_material,
        descricao: item.descricao || undefined,
        quantidade: Number(item.quantidade) || 0,
        classificacao: item.classificacao || undefined,
      })),
    };
  } catch (error: any) {
    return {
      retornoResumo: {
        ...DEFAULT_RESULT.retornoResumo,
        status: "ERRO_MEDICAO",
        errorMessage: error?.message,
      },
      maoDeObra: [],
      materiaisAplicados: [],
      materiaisRetirados: [],
    };
  }
}
