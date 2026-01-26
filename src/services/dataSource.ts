import { equipesCatalog } from "@/data/equipesCatalog";
import { codigosMOCatalog } from "@/data/codigosMOCatalog";
// Buscar códigos de mão de obra
export async function fetchCodigosMO(): Promise<DataSourceResult<any[]>> {
  const source = import.meta.env.VITE_DATA_SOURCE || "local";
  try {
    if (source === "local") {
      // Retorna sempre o mock local
      return { data: codigosMOCatalog, error: null };
    } else if (source === "api") {
      // Consome API local e extrai apenas o array
      const res = await fetch("http://localhost:3000/codigosMO");
      if (!res.ok) {
        return {
          data: [],
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      const arr = Array.isArray(json?.data) ? json.data : [];
      if (arr.length > 0) {
        return { data: arr, error: null };
      } else {
        return {
          data: [],
          error: {
            message: 'Resposta da API não contém array de códigos.',
            code: 'invalid_api_response',
            details: json,
          },
        };
      }
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
    } else if (source === "api") {
      // Consome API local e extrai apenas o array
      const res = await fetch("http://localhost:3000/materiais");
      if (!res.ok) {
        return {
          data: [],
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      const arr = Array.isArray(json?.data) ? json.data : [];
      if (arr.length > 0) {
        return { data: arr, error: null };
      } else {
        return {
          data: [],
          error: {
            message: 'Resposta da API não contém array de materiais.',
            code: 'invalid_api_response',
            details: json,
          },
        };
      }
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
    } else if (source === "api") {
      // Consome API local e extrai apenas o array
      const res = await fetch("http://localhost:3000/equipes");
      if (!res.ok) {
        return {
          data: [],
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      const arr = Array.isArray(json?.data) ? json.data : [];
      if (arr.length > 0) {
        return { data: arr, error: null };
      } else {
        return {
          data: [],
          error: {
            message: 'Resposta da API não contém array de equipes.',
            code: 'invalid_api_response',
            details: json,
          },
        };
      }
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
