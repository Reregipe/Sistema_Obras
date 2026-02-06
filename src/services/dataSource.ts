import { supabase } from "@/integrations/supabase/client";
import { equipesCatalog } from "@/data/equipesCatalog";
import { codigosMOCatalog } from "@/data/codigosMOCatalog";
// Buscar códigos de mão de obra
export async function fetchCodigosMO(): Promise<DataSourceResult<any[]>> {
  const source = import.meta.env.VITE_DATA_SOURCE || "local";
  try {
    if (source === "local") {
      // Retorna sempre o mock local
      return { data: codigosMOCatalog, error: null };
    } else if (source === "supabase" || source === "api") {
      const { data, error } = await supabase
        .from('codigos_mao_de_obra')
        .select('*')
        .order('codigo');
      if (error) {
        return {
          data: [],
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
          },
        };
      }
      return { data: data || [], error: null };
    } else {
      return {
        data: [],
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: [],
      error: {
        message: err?.message ?? "Erro desconhecido",
        details: err,
      },
    };
  }
}

// Buscar materiais
export async function fetchMateriais(): Promise<DataSourceResult<any[]>> {
  const source = import.meta.env.VITE_DATA_SOURCE || "local";
  try {
    if (source === "local") {
      // Retorna sempre o mock local (se existir)
      return { data: materiaisCatalog, error: null };
    } else if (source === "supabase" || source === "api") {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('codigo_material');
      if (error) {
        return {
          data: [],
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
          },
        };
      }
      return { data: data || [], error: null };
    } else {
      return {
        data: [],
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: [],
      error: {
        message: err?.message ?? "Erro desconhecido",
        details: err,
      },
    };
  }
}
// Centraliza acesso a dados do sistema
// Futuramente pode alternar entre Supabase, API local, etc.
// Retorno padronizado: { data, error }

export type DataSourceError = {
  message: string;
  code?: string | number;
  details?: any;
};

export type DataSourceResult<T> = {
  data: T | null;
  error: DataSourceError | null;
};

// Exemplo: buscar equipes
export async function fetchEquipes(): Promise<DataSourceResult<any[]>> {
  const source = import.meta.env.VITE_DATA_SOURCE || "local";
  try {
    if (source === "local") {
      // Retorna sempre o mock local
      return { data: equipesCatalog, error: null };
    } else if (source === "supabase" || source === "api") {
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nome_equipe');
      if (error) {
        return {
          data: [],
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
          },
        };
      }
      return { data: data || [], error: null };
    } else {
      return {
        data: [],
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: [],
      error: {
        message: err?.message ?? "Erro desconhecido",
        details: err,
      },
    };
  }
}

// Outras funções podem ser adicionadas conforme necessidade
