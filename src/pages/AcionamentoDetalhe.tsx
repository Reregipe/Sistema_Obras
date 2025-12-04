import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EquipeOption = {
  id_equipe: string;
  nome_equipe: string;
  encarregado_nome?: string | null;
  linha?: string | null;
  ativo?: string | null;
};

type Adicional = {
  id_equipe: string;
  nome: string;
  encarregado?: string | null;
};

type AcionamentoRecord = {
  id_acionamento: string;
  codigo_acionamento?: string | null;
  modalidade?: string | null;
  status?: string | null;
  prioridade?: string | null;
  prioridade_nivel?: string | null;
  municipio?: string | null;
  endereco?: string | null;
  encarregado?: string | null;
  id_equipe?: string | null;
  data_abertura?: string | null;
  data_despacho?: string | null;
  observacao?: string | null;
  numero_os?: string | null;
  data_execucao?: string | null;
  data_conclusao?: string | null;
  medicao_enviada_em?: string | null;
  medicao_aprovada_em?: string | null;
  lote_gerado_em?: string | null;
  nf_emitida_em?: string | null;
  nf_numero?: string | null;
};

const PRIORIDADE_OPCOES = [
  { value: "emergencia", label: "Emergência" },
  { value: "programado", label: "Programado" },
];

const NIVEL_OPCOES = [
  { value: "normal", label: "Normal" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const MODALIDADES = ["LM", "LV", "LM+LV"];

const capitalize = (value?: string | null) => {
  if (!value) return "";
  const v = value.replace("_", " ");
  return v.charAt(0).toUpperCase() + v.slice(1);
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
};

const toIsoOrNull = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

export default function AcionamentoDetalhe() {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [acionamento, setAcionamento] = useState<AcionamentoRecord | null>(null);
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [equipesAdicionais, setEquipesAdicionais] = useState<Adicional[]>([]);
  const [form, setForm] = useState<Record<string, string>>({
    modalidade: "",
    status: "",
    prioridade: "",
    prioridade_nivel: "",
    municipio: "",
    endereco: "",
    id_equipe: "",
    encarregado: "",
    data_abertura: "",
    data_despacho: "",
    observacao: "",
    numero_os: "",
    data_execucao: "",
    data_conclusao: "",
    medicao_enviada_em: "",
    medicao_aprovada_em: "",
    lote_gerado_em: "",
    nf_emitida_em: "",
    nf_numero: "",
  });

  const filteredEquipes = useMemo(() => {
    if (!form.modalidade || form.modalidade === "LM+LV") return equipes;
    return equipes.filter((e) => !e.linha || e.linha === form.modalidade);
  }, [equipes, form.modalidade]);

  const loadEquipes = async (): Promise<EquipeOption[]> => {
    try {
      const { data, error } = await supabase
        .from("equipes")
        .select("id_equipe,nome_equipe,encarregado_nome,linha,ativo");
      if (error) throw error;
      const ativos = (data || []).filter((e) => e.ativo !== "N");
      setEquipes(ativos as EquipeOption[]);
      return ativos as EquipeOption[];
    } catch (err) {
      console.error("Erro ao carregar equipes", err);
      return [];
    }
  };

  const loadAdicionais = async (idAcionamento: string, eqList?: EquipeOption[]) => {
    try {
      const lookup = (eqList || equipes) as EquipeOption[];
      const { data } = await supabase
        .from("acionamento_equipes")
        .select("id_equipe, encarregado_nome")
        .eq("id_acionamento", idAcionamento);
      const mapped: Adicional[] =
        data?.map((item) => ({
          id_equipe: item.id_equipe,
          nome: lookup.find((e) => e.id_equipe === item.id_equipe)?.nome_equipe || item.id_equipe,
          encarregado: item.encarregado_nome || "",
        })) || [];
      setEquipesAdicionais(mapped);
    } catch (err) {
      console.error("Erro ao carregar equipes adicionais", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!codigo) return;
      setLoading(true);
      setErro(null);
      try {
        const eqs = await loadEquipes();
        const { data, error } = await supabase
          .from("acionamentos")
          .select("*")
          .eq("codigo_acionamento", codigo)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setErro("Acionamento não encontrado.");
          return;
        }
        const rec = data as any as AcionamentoRecord;
        setAcionamento(rec);
        setForm({
          modalidade: rec.modalidade || "",
          status: rec.status || "",
          prioridade: rec.prioridade || "",
          prioridade_nivel: rec.prioridade_nivel || "",
          municipio: rec.municipio || "",
          endereco: rec.endereco || "",
          id_equipe: rec.id_equipe || "",
          encarregado: rec.encarregado || "",
          data_abertura: rec.data_abertura || "",
          data_despacho: rec.data_despacho || "",
          observacao: rec.observacao || "",
          numero_os: rec.numero_os || "",
          data_execucao: rec.data_execucao || "",
          data_conclusao: rec.data_conclusao || "",
          medicao_enviada_em: rec.medicao_enviada_em || "",
          medicao_aprovada_em: rec.medicao_aprovada_em || "",
          lote_gerado_em: rec.lote_gerado_em || "",
          nf_emitida_em: rec.nf_emitida_em || "",
          nf_numero: rec.nf_numero || "",
        });
        await loadAdicionais(rec.id_acionamento, eqs);
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar acionamento.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [codigo]);

  const onChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEquipeChange = (idEquipe: string) => {
    onChange("id_equipe", idEquipe);
    const eq = equipes.find((e) => e.id_equipe === idEquipe);
    if (eq) {
      onChange("encarregado", eq.encarregado_nome || "");
    }
  };

  const equipesAddDisponiveis = useMemo(() => {
    return equipes.filter((e) => {
      if (form.modalidade === "LM") return e.linha === "LM" || !e.linha;
      if (form.modalidade === "LV") return e.linha === "LV" || !e.linha;
      return true;
    });
  }, [equipes, form.modalidade]);

  const isMulti = form.modalidade === "LM+LV";

  const encarregadosDisponiveis = useMemo(() => {
    const list: string[] = [];
    const principal = equipes.find((e) => e.id_equipe === form.id_equipe);
    if (principal?.encarregado_nome) list.push(principal.encarregado_nome);
    equipesAdicionais.forEach((e) => {
      if (e.encarregado) list.push(e.encarregado);
    });
    if (form.encarregado) list.push(form.encarregado);
    return Array.from(new Set(list.filter(Boolean)));
  }, [equipes, form.id_equipe, equipesAdicionais, form.encarregado]);

  const addEquipeAdicional = (idEquipe: string) => {
    if (!idEquipe) return;
    const eq = equipes.find((e) => e.id_equipe === idEquipe);
    if (!eq) return;
    // Se for LM+LV e não houver principal, define principal
    if (isMulti && !form.id_equipe) {
      onChange("id_equipe", idEquipe);
      return;
    }
    // evita duplicar principal ou adicionais
    if (idEquipe === form.id_equipe || equipesAdicionais.some((a) => a.id_equipe === idEquipe)) return;
    setEquipesAdicionais((prev) => [
      ...prev,
      { id_equipe: idEquipe, nome: eq.nome_equipe, encarregado: eq.encarregado_nome || "" },
    ]);
    if (!isMulti) {
      onChange("modalidade", "LM+LV");
    }
  };

  const removeEquipeAdicional = (idEquipe: string) => {
    if (idEquipe === form.id_equipe) {
      // removendo a principal: promove a primeira adicional (se existir) como principal
      const restantes = equipesAdicionais.filter((e) => e.id_equipe !== idEquipe);
      const novaPrincipal = restantes.shift();
      onChange("id_equipe", novaPrincipal?.id_equipe || "");
      onChange("encarregado", novaPrincipal?.encarregado || "");
      setEquipesAdicionais(restantes);
      return;
    }
    setEquipesAdicionais((prev) => prev.filter((e) => e.id_equipe !== idEquipe));
  };

  const encarregadosSelecionados = useMemo(() => {
    const list: string[] = [];
    const principal = equipes.find((e) => e.id_equipe === form.id_equipe);
    if (principal?.encarregado_nome) list.push(principal.encarregado_nome);
    equipesAdicionais.forEach((e) => {
      if (e.encarregado) list.push(e.encarregado);
    });
    return list;
  }, [equipes, form.id_equipe, equipesAdicionais]);

  const getAutoStatus = () => {
    if (form.nf_emitida_em || form.nf_numero) return "concluido";
    if (
      form.lote_gerado_em ||
      form.medicao_aprovada_em ||
      form.medicao_enviada_em ||
      form.data_execucao ||
      form.data_conclusao
    ) {
      return "em_execucao";
    }
    if (form.data_despacho) return "despachado";
    return "aberto";
  };

  const handleSave = async () => {
    if (!acionamento) return;
    setSaving(true);
    setErro(null);
    setInfo(null);
    try {
      let modalidade = (form.modalidade || "").toUpperCase().replace(/\s+/g, "");
      if (equipesAdicionais.length > 0) modalidade = "LM+LV";
      if (!MODALIDADES.includes(modalidade)) modalidade = "LM";

      const status = getAutoStatus();

      const payload: Record<string, any> = {
        modalidade,
        status,
        prioridade: form.prioridade || null,
        prioridade_nivel: form.prioridade_nivel || null,
        municipio: form.municipio || null,
        endereco: form.endereco || null,
        id_equipe: form.id_equipe || null,
        encarregado: form.encarregado || null,
        data_abertura: toIsoOrNull(form.data_abertura),
        data_despacho: toIsoOrNull(form.data_despacho),
        observacao: form.observacao || null,
      };

      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", acionamento.id_acionamento);
      if (error) throw error;

      if (acionamento.id_acionamento) {
        await supabase.from("acionamento_equipes").delete().eq("id_acionamento", acionamento.id_acionamento);
        if (modalidade === "LM+LV" && equipesAdicionais.length > 0) {
          const insertPayload = equipesAdicionais.map((e) => ({
            id_acionamento: acionamento.id_acionamento,
            id_equipe: e.id_equipe,
            encarregado_nome: e.encarregado || null,
          }));
          const { error: errIns } = await supabase.from("acionamento_equipes").insert(insertPayload);
          if (errIns) throw errIns;
        }
      }

      setInfo("Acionamento salvo com sucesso.");
      const { data: refreshed } = await supabase
        .from("acionamentos")
        .select("*")
        .eq("codigo_acionamento", codigo || "")
        .maybeSingle();
      if (refreshed) {
        setAcionamento(refreshed as any);
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar acionamento.");
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

  if (!acionamento) {
    return (
      <div className="p-6">
        <div className="text-sm text-destructive">Acionamento não encontrado.</div>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/acionamentos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center space-y-1">
          <h1 className="text-2xl font-bold">Acionamento {acionamento.codigo_acionamento || codigo}</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/acionamentos">Voltar</Link>
        </Button>
      </div>

      {(erro || info) && (
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className={`h-4 w-4 ${erro ? "text-destructive" : "text-emerald-600"}`} />
          <span className={erro ? "text-destructive" : "text-emerald-600"}>{erro || info}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados do acionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Modalidade</Label>
              <Select value={form.modalidade} onValueChange={(v) => onChange("modalidade", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Input value={capitalize(getAutoStatus())} readOnly />
            </div>
            {!isMulti && (
              <>
                <div>
                  <Label>Equipe</Label>
                  <Select value={form.id_equipe} onValueChange={(v) => handleEquipeChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEquipes.map((eq) => (
                        <SelectItem key={eq.id_equipe} value={eq.id_equipe}>
                          {eq.nome_equipe}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Encarregado</Label>
                  <Input value={form.encarregado} onChange={(e) => onChange("encarregado", e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>Município</Label>
              <Input value={form.municipio} onChange={(e) => onChange("municipio", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => onChange("endereco", e.target.value)} />
            </div>
            <div>
              <Label>Data de abertura</Label>
              <Input
                type="date"
                value={form.data_abertura ? form.data_abertura.slice(0, 10) : ""}
                onChange={(e) => onChange("data_abertura", e.target.value)}
              />
            </div>
            <div>
              <Label>Data de despacho</Label>
              <Input
                type="datetime-local"
                value={toDateTimeLocal(form.data_despacho)}
                onChange={(e) => onChange("data_despacho", e.target.value)}
              />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => onChange("prioridade", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADE_OPCOES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nível</Label>
              <Select value={form.prioridade_nivel} onValueChange={(v) => onChange("prioridade_nivel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {NIVEL_OPCOES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isMulti && (
            <div className="space-y-2">
              <Label>Equipes (LM + LV)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select onValueChange={(v) => addEquipeAdicional(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipesAddDisponiveis
                      .filter((eq) => eq.id_equipe !== form.id_equipe && !equipesAdicionais.some((a) => a.id_equipe === eq.id_equipe))
                      .map((eq) => (
                        <SelectItem key={eq.id_equipe} value={eq.id_equipe}>
                          {eq.nome_equipe}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.id_equipe && (
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm">
                    {equipes.find((e) => e.id_equipe === form.id_equipe)?.nome_equipe || form.id_equipe}
                    <button
                      type="button"
                      className="ml-2 text-muted-foreground hover:text-destructive"
                      onClick={() => removeEquipeAdicional(form.id_equipe)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {equipesAdicionais.map((eq) => (
                  <span
                    key={eq.id_equipe}
                    className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {eq.nome || eq.id_equipe}
                    <button
                      type="button"
                      className="ml-2 text-muted-foreground hover:text-destructive"
                      onClick={() => removeEquipeAdicional(eq.id_equipe)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {encarregadosDisponiveis.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Encarregados das equipes: {encarregadosDisponiveis.join(", ")}
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Observação</Label>
            <Textarea value={form.observacao} onChange={(e) => onChange("observacao", e.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
