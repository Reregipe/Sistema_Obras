// Buscar códigos de mão de obra
export async function fetchCodigosMO(): Promise<DataSourceResult<any[]>> {
  const source = import.meta.env.VITE_DATA_SOURCE || "local";
  try {
    if (source === "local") {
      const res = await fetch("http://localhost:3000/codigosMO");
      if (!res.ok) {
        return {
          data: null,
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      return { data: json.data ?? [], error: null };
    } else if (source === "supabase") {
      // Implemente chamada real ao Supabase
      return {
        data: [],
        error: {
          message: "Supabase não implementado neste exemplo.",
          code: "not_implemented",
        },
      };
    } else {
      return {
        data: null,
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: null,
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
      const res = await fetch("http://localhost:3000/materiais");
      if (!res.ok) {
        return {
          data: null,
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      return { data: json.data ?? [], error: null };
    } else if (source === "supabase") {
      // Implemente chamada real ao Supabase
      return {
        data: [],
        error: {
          message: "Supabase não implementado neste exemplo.",
          code: "not_implemented",
        },
      };
    } else {
      return {
        data: null,
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: null,
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
      const res = await fetch("http://localhost:3000/equipes");
      if (!res.ok) {
        return {
          data: null,
          error: {
            message: `HTTP ${res.status}`,
            code: res.status,
            details: await res.text(),
          },
        };
      }
      const json = await res.json();
      return { data: json.data ?? [], error: null };
    } else if (source === "supabase") {
      // Exemplo: Supabase
      // Implemente aqui a chamada real ao Supabase
      // Retorne no formato { data, error }
      // Exemplo mock:
      return {
        data: [],
        error: {
          message: "Supabase não implementado neste exemplo.",
          code: "not_implemented",
        },
      };
    } else {
      return {
        data: null,
        error: {
          message: `Fonte de dados desconhecida: ${source}`,
          code: "unknown_source",
        },
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: {
        message: err?.message ?? "Erro desconhecido",
        details: err,
      },
    };
  }
}

// Outras funções podem ser adicionadas conforme necessidade
