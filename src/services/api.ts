// Atualiza o status (ativo/inativo) de um material
export async function updateMaterialStatus(codigo_material: string, ativo: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/materiais/${codigo_material}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ativo }),
  });
  const json = await response.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Erro ao atualizar status do material');
}
// Camada de acesso à API para o frontend React
// Utiliza fetch e centraliza tratamento de erro

const BASE_URL = "http://localhost:3000";

// Interfaces mínimas
export interface Usuario {
  id_usuario: string;
  nome: string;
  email_empresa: string;
}

export interface Equipe {
  id_equipe: string;
  nome_equipe: string;
}

export interface Acionamento {
  id_acionamento: string;
  codigo_acionamento: string;
  status: string;
}

// Resposta padrão da API
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Helper reutilizável para requisições
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Erro desconhecido na API');
  }
  return json.data as T;
}

// Funções de acesso à API
export function getUsuarios(): Promise<Usuario[]> {
  return request<Usuario[]>("/usuarios");
}

export function getEquipes(): Promise<Equipe[]> {
  return request<Equipe[]>("/equipes");
}


export async function createAcionamento(payload: Omit<Acionamento, "id_acionamento"> & Record<string, any>): Promise<Acionamento> {
  return request<Acionamento>("/acionamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function vincularEquipesAcionamento(id_acionamento: string, equipes: string[]): Promise<any> {
  return request<any>("/acionamento_equipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_acionamento, equipes }),
  });
}

export async function getCodigosMO(params?: Record<string, any>): Promise<any[]> {
  const query = new URLSearchParams(params || {}).toString();
  return request<any[]>(`/codigos_mao_de_obra${query ? `?${query}` : ""}`);
}

export async function getSystemSettings(keys: string[]): Promise<any[]> {
  return request<any[]>(`/system_settings?keys=${keys.join(",")}`);
}

export async function upsertCodigoMO(payload: Record<string, any>): Promise<any> {
  return request<any>("/codigos_mao_de_obra", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}


export async function getListaCabecalho(id_acionamento: string): Promise<any> {
  return request<any>(`/lista_aplicacao_cabecalho?id_acionamento=${id_acionamento}`);
}

export async function getListaItens(id_lista_aplicacao: string): Promise<any[]> {
  return request<any[]>(`/lista_aplicacao_itens?id_lista_aplicacao=${id_lista_aplicacao}`);
}

export async function getMateriais(codigos: string[]): Promise<any[]> {
  return request<any[]>(`/materiais?codigos=${codigos.join(",")}`);
}

export async function getEquipesByIds(ids: string[]): Promise<any[]> {
  return request<any[]>(`/equipes?ids=${ids.join(",")}`);
}

export async function saveMedicao(medicao: any) {
  try {
    const response = await fetch(`${BASE_URL}/medicoes`, {
      method: medicao.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medicao),
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao salvar medição', err);
    return { success: false, error: err };
  }
}

export async function saveBook(book: any) {
  try {
    const response = await fetch(`${BASE_URL}/books`, {
      method: book.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(book),
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao salvar book', err);
    return { success: false, error: err };
  }
}

export async function saveSucata(sucata: any) {
  try {
    const response = await fetch(`${BASE_URL}/sucatas`, {
      method: sucata.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sucata),
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao salvar sucata', err);
    return { success: false, error: err };
  }
}

export async function saveConsumo(consumo: any) {
  try {
    const response = await fetch(`${BASE_URL}/consumos`, {
      method: consumo.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(consumo),
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao salvar consumo', err);
    return { success: false, error: err };
  }
}

export async function saveAuditoria(auditoria: any) {
  try {
    const response = await fetch(`${BASE_URL}/auditorias`, {
      method: auditoria.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auditoria),
    });
    return await response.json();
  } catch (err) {
    console.error('Erro ao salvar auditoria', err);
    return { success: false, error: err };
  }
}

export async function getAcionamentoById(id) {
  const response = await fetch(`${BASE_URL}/acionamentos/${id}`);
  return await response.json();
}

export async function getEquipesRelacionadas(idAcionamento) {
  const response = await fetch(`${BASE_URL}/acionamento_equipes?id_acionamento=${idAcionamento}`);
  return await response.json();
}

export async function getConsumoItens(idAcionamento) {
  const response = await fetch(`${BASE_URL}/lista_aplicacao_itens?id_acionamento=${idAcionamento}`);
  return await response.json();
}

export async function getSucataItens(idAcionamento) {
  const response = await fetch(`${BASE_URL}/sucata_itens?id_acionamento=${idAcionamento}`);
  return await response.json();
}

export async function getMedicaoRascunho(idAcionamento) {
  const response = await fetch(`${BASE_URL}/medicao_orcamentos?id_acionamento=${idAcionamento}`);
  return await response.json();
}

export async function updateEtapaAcionamento(idAcionamento, etapa, data) {
  const response = await fetch(`${BASE_URL}/acionamentos/${idAcionamento}/etapa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etapa_atual: etapa, medicao_registrada_em: data }),
  });
  return await response.json();
}

export async function getAcionamentos() {
  const response = await fetch(`${BASE_URL}/acionamentos`);
  const json = await response.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Erro ao buscar acionamentos');
}

export async function searchMateriais(term: string) {
  const response = await fetch(`${BASE_URL}/materiais/search?term=${encodeURIComponent(term)}`);
  return await response.json();
}

export async function getMaterialByCodigoOrDescricao(term: string) {
  const response = await fetch(`${BASE_URL}/materiais?codigo=${encodeURIComponent(term)}&descricao=${encodeURIComponent(term)}`);
  return await response.json();
}

export async function saveListaCabecalho(id_acionamento: string) {
  const response = await fetch(`${BASE_URL}/lista_aplicacao_cabecalho`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_acionamento })
  });
  return await response.json();
}

export async function saveListaItens(listaId: string, itens: any[]) {
  // Remove itens antigos e insere novos
  await fetch(`${BASE_URL}/lista_aplicacao_itens?listaId=${listaId}`, { method: 'DELETE' });
  const response = await fetch(`${BASE_URL}/lista_aplicacao_itens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itens)
  });
  return await response.json();
}

export async function getAcionamentoExecucao(id_acionamento) {
  const response = await fetch(`${BASE_URL}/acionamento_execucao?id_acionamento=${id_acionamento}`);
  const json = await response.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Erro ao buscar execução do acionamento');
}

export async function getAcionamentosCountByEtapa(etapaId) {
  const response = await fetch(`${BASE_URL}/acionamentos/count?etapa_atual=${etapaId}`);
  const json = await response.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Erro ao contar acionamentos');
}

export async function getAcionamentosByEtapa(etapaId) {
  const response = await fetch(`${BASE_URL}/acionamentos?etapa_atual=${etapaId}`);
  const json = await response.json();
  if (json.success) return json.data;
  throw new Error(json.error || 'Erro ao buscar acionamentos por etapa');
}

// Pronto para crescer: adicione novas funções seguindo o padrão acima.
