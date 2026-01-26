// Centraliza acesso a dados do sistema
// Futuramente pode alternar entre Supabase, API local, etc.
// Retorno padronizado: { data, error }

export type DataSourceResult<T> = {
  data: T | null;
  error: string | null;
};

// Exemplo: buscar equipes
export async function fetchEquipes(): Promise<DataSourceResult<any[]>> {
  try {
    // Exemplo: API local
    const res = await fetch("http://localhost:3000/equipes");
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    return { data: json.data ?? [], error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? "Erro desconhecido" };
  }
}

// Outras funções podem ser adicionadas conforme necessidade
