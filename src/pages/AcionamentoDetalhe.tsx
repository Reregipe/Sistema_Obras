import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Save, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AcionamentoRow = Database["public"]["Tables"]["acionamentos"]["Row"];
type ObraRow = Database["public"]["Tables"]["obras"]["Row"];
type ListaCabecalhoRow = Database["public"]["Tables"]["lista_aplicacao_cabecalho"]["Row"];
type ListaItemRow = Database["public"]["Tables"]["lista_aplicacao_itens"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materiais"]["Row"];
type SystemSettingRow = Database["public"]["Tables"]["system_settings"]["Row"];

export default function AcionamentoDetalhe() {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMateriais, setLoadingMateriais] = useState(false);
  const [acionamento, setAcionamento] = useState<AcionamentoRow | null>(null);
  const [obra, setObra] = useState<ObraRow | null>(null);
  const [lista, setLista] = useState<ListaCabecalhoRow | null>(null);
  const [itens, setItens] = useState<ListaItemRow[]>([]);
  const [materiais, setMateriais] = useState<MaterialRow[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [creatingObra, setCreatingObra] = useState(false);
  const [upsConfig, setUpsConfig] = useState<{ lm: number | null; lv: number | null }>({ lm: null, lv: null });
  const [info, setInfo] = useState<string | null>(null);

  const [form, setForm] = useState({
    status: "",
    prioridade: "",
    prioridade_nivel: "",
    municipio: "",
    numero_os: "",
    observacao: "",
  });

  const [novoItem, setNovoItem] = useState({
    codigo_material: "",
    descricao_item: "",
    unidade_medida: "",
    quantidade: 1,
    valor_unitario_upr: 0,
  });

  const [novoCabecalho, setNovoCabecalho] = useState({
    data_emissao: new Date().toISOString().substring(0, 10),
    observacao: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!codigo) return;
      setLoading(true);
      setErro(null);

      try {
        const { data: ac, error: e1 } = await supabase
          .from("acionamentos")
          .select("*")
          .eq("codigo_acionamento", codigo)
          .maybeSingle();
        if (e1) throw e1;
        if (!ac) {
          setErro("Acionamento nao encontrado");
          setLoading(false);
          return;
        }
        setAcionamento(ac);
        setForm({
          status: ac.status || "",
          prioridade: ac.prioridade || "",
          prioridade_nivel: ac.prioridade_nivel || "",
          municipio: ac.municipio || "",
          numero_os: ac.numero_os || "",
          observacao: (ac as any).observacao || "",
        });

        const { data: ob, error: e2 } = await supabase
          .from("obras")
          .select("id_obra, numero_os, modalidade, codigo_acionamento")
          .eq("codigo_acionamento", codigo)
          .maybeSingle();
        if (e2) throw e2;
        if (ob) {
          setObra(ob);

          const { data: cabList, error: e3 } = await supabase
            .from("lista_aplicacao_cabecalho")
            .select("*")
            .eq("id_obra", ob.id_obra)
            .order("data_emissao", { ascending: false })
            .limit(1);
          if (e3) throw e3;
          const cab = cabList?.[0] || null;
          setLista(cab || null);

          if (cab) {
            const { data: it, error: e4 } = await supabase
              .from("lista_aplicacao_itens")
              .select("*")
              .eq("id_lista_aplicacao", cab.id_lista_aplicacao)
              .order("ordem_item", { ascending: true });
            if (e4) throw e4;
            setItens(it || []);
          }
        }

        const [{ data: mat }, { data: settings }] = await Promise.all([
          supabase.from("materiais").select("*").order("descricao"),
          supabase.from("system_settings").select("*").in("chave", ["ups_valor_lm", "ups_valor_lv"]),
        ]);
        setMateriais(mat || []);
        if (settings) {
          const lm = settings.find((s: SystemSettingRow) => s.chave === "ups_valor_lm");
          const lv = settings.find((s: SystemSettingRow) => s.chave === "ups_valor_lv");
          setUpsConfig({
            lm: lm ? Number(lm.valor || 0) : null,
            lv: lv ? Number(lv.valor || 0) : null,
          });
        }
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [codigo]);

  const handleSaveAcionamento = async () => {
    if (!acionamento) return;
    setSaving(true);
    setErro(null);
    setInfo(null);
    try {
      const { error } = await supabase
        .from("acionamentos")
        .update({
          status: form.status || null,
          prioridade: form.prioridade || null,
          prioridade_nivel: form.prioridade_nivel || null,
          municipio: form.municipio || null,
          numero_os: form.numero_os || null,
          observacao: form.observacao || null,
        })
        .eq("id_acionamento", acionamento.id_acionamento);
      if (error) throw error;
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const getUpsValor = (modalidade?: string | null) => {
    if (!modalidade) return null;
    if (modalidade === "LV") return upsConfig.lv ?? upsConfig.lm ?? null;
    return upsConfig.lm ?? upsConfig.lv ?? null;
  };

  const ensureParamForModalidade = async (modalidade: string, valor: number) => {
    const contrato = modalidade === "LV" ? "UPS_PADRAO_LV" : "UPS_PADRAO_LM";
    const { data: existing, error: errFetch } = await supabase
      .from("parametros_upr")
      .select("*")
      .eq("contrato", contrato)
      .limit(1);
    if (errFetch) throw errFetch;
    if (existing && existing.length > 0) {
      return existing[0].id_param_upr;
    }

    const hoje = new Date().toISOString().substring(0, 10);
    const { data, error } = await supabase
      .from("parametros_upr")
      .insert([
        {
          contrato,
          valor_upr: valor,
          vigencia_inicio: hoje,
          vigencia_fim: null,
          observacao: "Gerado automaticamente a partir das configuracoes (system_settings).",
        },
      ])
      .select("id_param_upr")
      .single();
    if (error) throw error;
    return data.id_param_upr;
  };

  const handleCriarCabecalho = async () => {
    if (!obra || !codigo) {
      setErro("Associe o acionamento a uma obra para criar a lista de aplicacao.");
      return;
    }
    if (!obra.numero_os) {
      setErro("Defina o numero da OS na obra vinculada antes de criar a lista.");
      return;
    }
    if (!obra.modalidade) {
      setErro("A obra vinculada precisa ter modalidade definida.");
      return;
    }

    const upsValor = getUpsValor(obra.modalidade);
    if (upsValor === null) {
      setErro("Configure o valor de UPS em Configuracoes (ups_valor_lm / ups_valor_lv).");
      return;
    }

    setSaving(true);
    setErro(null);
    try {
      const idParam = await ensureParamForModalidade(obra.modalidade, upsValor);
      const { data, error } = await supabase
        .from("lista_aplicacao_cabecalho")
        .insert([
          {
            id_obra: obra.id_obra,
            id_param_upr: idParam,
            numero_os: obra.numero_os,
            modalidade: obra.modalidade,
            data_emissao: new Date(novoCabecalho.data_emissao).toISOString(),
            upr_valor_usado: upsValor,
            observacao: novoCabecalho.observacao || null,
            equipe: null,
            viatura: null,
            status: "aberta",
          },
        ])
        .select("*")
        .single();
      if (error) throw error;
      setLista(data);
      setItens([]);
    } catch (err: any) {
      setErro(err.message || "Erro ao criar lista de aplicacao");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!lista) {
      setErro("Crie a lista de aplicacao antes de inserir itens.");
      return;
    }
    if (!novoItem.descricao_item) {
      setErro("Busque um material valido antes de adicionar.");
      return;
    }
    if (!novoItem.quantidade || novoItem.quantidade <= 0) {
      setErro("Informe a quantidade.");
      return;
    }
    setLoadingMateriais(true);
    setErro(null);
    setInfo(null);
    try {
      const valorUnit = getUpsValor(obra?.modalidade) ?? 0;
      const valorTotal = novoItem.quantidade * valorUnit;
      const { data, error } = await supabase
        .from("lista_aplicacao_itens")
        .insert([
          {
            id_lista_aplicacao: lista.id_lista_aplicacao,
            codigo_material: novoItem.codigo_material,
            descricao_item: novoItem.descricao_item,
            unidade_medida: novoItem.unidade_medida,
            quantidade: novoItem.quantidade,
            valor_unitario_upr: valorUnit,
            valor_total: valorTotal,
            ordem_item: itens.length + 1,
          },
        ])
        .select("*")
        .single();
      if (error) throw error;
      setItens((prev) => [...prev, data]);
      setNovoItem({
        codigo_material: "",
        descricao_item: "",
        unidade_medida: "",
        quantidade: 1,
        valor_unitario_upr: 0,
      });
    } catch (err: any) {
      setErro(err.message || "Erro ao adicionar item");
    } finally {
      setLoadingMateriais(false);
    }
  };

  const materialOptions = useMemo(
    () =>
      materiais.map((m) => ({
        value: m.codigo_material,
        label: `${m.codigo_material} - ${m.descricao}`,
        unidade: m.unidade_medida,
      })),
    [materiais]
  );

  const selectedMaterial = materialOptions.find((m) => m.value === novoItem.codigo_material);

  useEffect(() => {
    if (selectedMaterial) {
      setNovoItem((prev) => ({
        ...prev,
        descricao_item: selectedMaterial.label,
        unidade_medida: selectedMaterial.unidade,
      }));
    }
  }, [selectedMaterial]);

  const handleBuscarMaterial = () => {
    if (!novoItem.codigo_material) {
      setErro("Informe o codigo do material.");
      return;
    }
    const mat = materiais.find(
      (m) => (m.codigo_material || "").toLowerCase() === novoItem.codigo_material.toLowerCase()
    );
    if (!mat) {
      setErro("Material nao encontrado.");
      setNovoItem((prev) => ({ ...prev, descricao_item: "", unidade_medida: "" }));
      return;
    }
    setErro(null);
    setNovoItem((prev) => ({
      ...prev,
      codigo_material: mat.codigo_material,
      descricao_item: mat.descricao,
      unidade_medida: mat.unidade_medida,
    }));
  };

  const handleCriarObraRascunho = async () => {
    if (!acionamento || !codigo) {
      setErro("Acionamento nao carregado.");
      return;
    }
    if (!acionamento.modalidade) {
      setErro("Modalidade do acionamento e obrigatoria para criar a obra rascunho.");
      return;
    }
    const agora = new Date();
    const generatedOs = `AC-${codigo}-TMP-${agora.getTime()}`;
    setCreatingObra(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from("obras")
        .insert([
          {
            codigo_acionamento: codigo,
            modalidade: acionamento.modalidade,
            numero_os: generatedOs,
            os_numero: generatedOs,
            os_status: "gerada",
            os_data_abertura: agora.toISOString(),
            os_data_envio_energisa: agora.toISOString(),
            os_prazo_abertura_energisa: 7,
            observacao: "Obra rascunho gerada a partir do acionamento.",
          },
        ])
        .select("id_obra, numero_os, modalidade, codigo_acionamento")
        .single();
      if (error) throw error;
      setObra(data);
      setLista(null);
      setItens([]);
    } catch (err: any) {
      setErro(err.message || "Erro ao criar obra rascunho");
    } finally {
      setCreatingObra(false);
    }
  };

  const handleRemoverItem = async (id: string) => {
    setErro(null);
    setInfo(null);
    try {
      const { error } = await supabase.from("lista_aplicacao_itens").delete().eq("id_lista_aplicacao_item", id);
      if (error) throw error;
      setItens((prev) => prev.filter((it) => it.id_lista_aplicacao_item !== id));
    } catch (err: any) {
      setErro(err.message || "Erro ao remover item");
    }
  };

  const handleGravarRequisicao = async () => {
    if (!lista) {
      setErro("Crie a lista antes de gravar.");
      return;
    }
    if (itens.length === 0) {
      setErro("Adicione pelo menos um item antes de gravar.");
      return;
    }
    setSaving(true);
    setErro(null);
    setInfo(null);
    try {
      const { data, error } = await supabase
        .from("lista_aplicacao_cabecalho")
        .update({ status: "carregada" })
        .eq("id_lista_aplicacao", lista.id_lista_aplicacao)
        .select("*")
        .single();
      if (error) throw error;
      setLista(data);
      setInfo("Requisicao gravada com sucesso.");
    } catch (err: any) {
      setErro(err.message || "Erro ao gravar requisicao");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando acionamento...
      </div>
    );
  }

  if (!codigo) {
    return <div className="p-6 text-muted-foreground">Codigo do acionamento nao informado.</div>;
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acionamento {codigo}</h1>
          <p className="text-sm text-muted-foreground">
            Edite os dados do acionamento e gerencie a lista de aplicacao (materiais) vinculada.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/acionamentos">Voltar</Link>
        </Button>
      </div>

      {erro && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {erro}
        </div>
      )}
      {info && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <AlertCircle className="h-4 w-4" />
          {info}
        </div>
      )}

      {acionamento && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do acionamento</CardTitle>
            <CardDescription>Atualize informacoes principais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="despachado">Despachado</SelectItem>
                    <SelectItem value="em_execucao">Em execucao</SelectItem>
                    <SelectItem value="concluido">Concluido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => setForm((f) => ({ ...f, prioridade: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergencia">Emergencia</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nivel</Label>
                <Select
                  value={form.prioridade_nivel}
                  onValueChange={(v) => setForm((f) => ({ ...f, prioridade_nivel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Municipio</Label>
                <Input value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} />
              </div>
              <div>
                <Label>Numero OS</Label>
                <Input value={form.numero_os} onChange={(e) => setForm((f) => ({ ...f, numero_os: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Observacao</Label>
              <Textarea
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveAcionamento} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Materiais (Lista de aplicacao)</CardTitle>
          <CardDescription>
            Itens sao gravados em <code>lista_aplicacao_cabecalho</code> e <code>lista_aplicacao_itens</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!obra && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Este acionamento ainda nao possui obra/OS. Crie uma obra rascunho (gera OS temporaria) para habilitar a
                lista de aplicacao.
              </p>
              <Button onClick={handleCriarObraRascunho} disabled={creatingObra}>
                {creatingObra ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar obra rascunho
              </Button>
            </div>
          )}

          {obra && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Modalidade: {obra.modalidade || "--"}</span>
                <span className="text-xs">(UPS fixa a partir das configuracoes)</span>
              </div>
              <div className="text-xs">
                UPS usada: {getUpsValor(obra.modalidade) ?? "--"} (ups_valor_lm / ups_valor_lv em Configuracoes)
              </div>
            </div>
          )}

          {obra && !lista && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma lista encontrada para esta obra (OS {obra.numero_os}). Crie uma nova.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Data de emissao</Label>
                  <Input
                    type="date"
                    value={novoCabecalho.data_emissao}
                    onChange={(e) => setNovoCabecalho((c) => ({ ...c, data_emissao: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Observacao</Label>
                  <Input
                    value={novoCabecalho.observacao}
                    onChange={(e) => setNovoCabecalho((c) => ({ ...c, observacao: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleCriarCabecalho} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Criar lista de aplicacao
              </Button>
            </div>
          )}

          {lista && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-foreground font-semibold">Lista #{lista.id_lista_aplicacao}</p>
                  <p className="text-xs text-muted-foreground">
                    Emissao: {new Date(lista.data_emissao).toLocaleDateString("pt-BR")} • Status: {lista.status}
                  </p>
                </div>
                <Badge variant="secondary">{obra?.numero_os || "Sem OS"}</Badge>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-sm font-semibold">Adicionar material</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Codigo</Label>
                    <Input
                      value={novoItem.codigo_material}
                      onChange={(e) => setNovoItem((i) => ({ ...i, codigo_material: e.target.value }))}
                      onBlur={handleBuscarMaterial}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="mt-1" onClick={handleBuscarMaterial} variant="secondary">
                      Buscar
                    </Button>
                  </div>
                  <div>
                    <Label>Descricao</Label>
                    <Input value={novoItem.descricao_item} disabled readOnly />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Input value={novoItem.unidade_medida} disabled readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={novoItem.quantidade}
                      disabled={!novoItem.descricao_item}
                      onChange={(e) => setNovoItem((i) => ({ ...i, quantidade: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddItem} disabled={loadingMateriais || !novoItem.descricao_item}>
                    {loadingMateriais ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar material
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item na lista.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2">Codigo</th>
                          <th className="py-2">Descricao</th>
                          <th className="py-2">Unidade</th>
                          <th className="py-2">Qtd</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {itens.map((it) => (
                          <tr key={it.id_lista_aplicacao_item}>
                            <td className="py-2">{it.codigo_material}</td>
                            <td className="py-2">{it.descricao_item}</td>
                            <td className="py-2">{it.unidade_medida}</td>
                            <td className="py-2">{it.quantidade}</td>
                            <td className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverItem(it.id_lista_aplicacao_item)}
                              >
                                Remover
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleGravarRequisicao} disabled={saving || itens.length === 0}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Gravar Requisicao
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
