// Camada de acesso à API para o frontend React
// Todas as chamadas agora utilizam o cliente Supabase diretamente

import { supabase } from '@/integrations/supabase/client';

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

// Funções de acesso à API via Supabase

export async function getUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getEquipes(): Promise<Equipe[]> {
  const { data, error } = await supabase.from('equipes').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAcionamentos(): Promise<Acionamento[]> {
  const { data, error } = await supabase.from('acionamentos').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAcionamento(payload: Omit<Acionamento, "id_acionamento"> & Record<string, any>): Promise<Acionamento> {
  const { data, error } = await supabase.from('acionamentos').insert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAcionamentoById(id: string): Promise<any> {
  const { data, error } = await supabase.from('acionamentos').select('*').eq('id_acionamento', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEtapaAcionamento(idAcionamento: string, etapa: string, data_medicao?: string): Promise<any> {
  const updatePayload: Record<string, any> = { etapa_atual: etapa };
  if (data_medicao) updatePayload.medicao_registrada_em = data_medicao;
  const { data, error } = await supabase.from('acionamentos').update(updatePayload).eq('id_acionamento', idAcionamento).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAcionamentosCountByEtapa(etapaId: string): Promise<number> {
  const { count, error } = await supabase.from('acionamentos').select('*', { count: 'exact', head: true }).eq('etapa_atual', etapaId);
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getAcionamentosByEtapa(etapaId: string): Promise<Acionamento[]> {
  const { data, error } = await supabase.from('acionamentos').select('*').eq('etapa_atual', etapaId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function vincularEquipesAcionamento(id_acionamento: string, equipes: string[]): Promise<any> {
  const rows = equipes.map(id_equipe => ({ id_acionamento, id_equipe }));
  const { data, error } = await supabase.from('acionamento_equipes').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function getEquipesRelacionadas(idAcionamento: string): Promise<any> {
  const { data, error } = await supabase.from('acionamento_equipes').select('*').eq('id_acionamento', idAcionamento);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getCodigosMO(params?: Record<string, any>): Promise<any[]> {
  let query = supabase.from('codigos_mao_de_obra').select('*');
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function upsertCodigoMO(payload: Record<string, any>): Promise<any> {
  const { data, error } = await supabase.from('codigos_mao_de_obra').upsert(payload).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getSystemSettings(keys: string[]): Promise<any[]> {
  const { data, error } = await supabase.from('system_settings').select('*').in('key', keys);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMateriais(codigos: string[]): Promise<any[]> {
  const { data, error } = await supabase.from('materiais').select('*').in('codigo_material', codigos);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function searchMateriais(term: string): Promise<any[]> {
  const { data, error } = await supabase.from('materiais').select('*').or(`codigo_material.ilike.%${term}%,descricao.ilike.%${term}%`);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMaterialByCodigoOrDescricao(term: string): Promise<any[]> {
  const { data, error } = await supabase.from('materiais').select('*').or(`codigo_material.ilike.%${term}%,descricao.ilike.%${term}%`);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateMaterialStatus(codigo_material: string, ativo: string): Promise<any> {
  const { data, error } = await supabase.from('materiais').update({ ativo }).eq('codigo_material', codigo_material).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getEquipesByIds(ids: string[]): Promise<any[]> {
  const { data, error } = await supabase.from('equipes').select('*').in('id_equipe', ids);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getListaCabecalho(id_acionamento: string): Promise<any> {
  const { data, error } = await supabase.from('lista_aplicacao_cabecalho').select('*').eq('id_acionamento', id_acionamento).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getListaItens(id_lista_aplicacao: string): Promise<any[]> {
  const { data, error } = await supabase.from('lista_aplicacao_itens').select('*').eq('id_lista_aplicacao', id_lista_aplicacao);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function saveListaCabecalho(id_acionamento: string): Promise<any> {
  const { data, error } = await supabase.from('lista_aplicacao_cabecalho').upsert({ id_acionamento }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveListaItens(listaId: string, itens: any[]): Promise<any> {
  // Remove itens antigos e insere novos
  await supabase.from('lista_aplicacao_itens').delete().eq('id_lista_aplicacao', listaId);
  if (itens.length > 0) {
    const { data, error } = await supabase.from('lista_aplicacao_itens').insert(itens).select();
    if (error) throw new Error(error.message);
    return data;
  }
  return [];
}

export async function getConsumoItens(idAcionamento: string): Promise<any[]> {
  const { data, error } = await supabase.from('lista_aplicacao_itens').select('*').eq('id_acionamento', idAcionamento);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getSucataItens(idAcionamento: string): Promise<any[]> {
  const { data, error } = await supabase.from('sucata_itens').select('*').eq('id_acionamento', idAcionamento);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getMedicaoRascunho(idAcionamento: string): Promise<any> {
  const { data, error } = await supabase.from('medicao_orcamentos').select('*').eq('id_acionamento', idAcionamento).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveMedicao(medicao: any): Promise<any> {
  const { data, error } = await supabase.from('medicao_orcamentos').upsert(medicao).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveBook(book: any): Promise<any> {
  // Books are stored alongside medição data
  const { data, error } = await supabase.from('medicao_orcamentos').upsert(book).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveSucata(sucata: any): Promise<any> {
  const { data, error } = await supabase.from('sucata_itens').upsert(sucata).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveConsumo(consumo: any): Promise<any> {
  const { data, error } = await supabase.from('lista_aplicacao_itens').upsert(consumo).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveAuditoria(auditoria: any): Promise<any> {
  const { data, error } = await supabase.from('acionamento_etapa_logs').insert(auditoria).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAcionamentoExecucao(id_acionamento: string): Promise<any> {
  const { data, error } = await supabase.from('acionamento_execucao').select('*').eq('id_acionamento', id_acionamento).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// Pronto para crescer: adicione novas funções seguindo o padrão acima.
