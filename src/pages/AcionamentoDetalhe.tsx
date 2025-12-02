import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AcionamentoRow = Database["public"]["Tables"]["acionamentos"]["Row"];

const STATUS_OPCOES = [
  "aberto",
  "despachado",
  "em_execucao",
  "concluido",
  "cancelado",
  "programado",
  "em_andamento",
  "pendente",
];

export default function AcionamentoDetalhe() {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [acionamento, setAcionamento] = useState<AcionamentoRow | null>(null);

  const [form, setForm] = useState({
    status: "",
    prioridade: "",
    prioridade_nivel: "",
    municipio: "",
    numero_os: "",
    observacao: "",
    origem: "",
    modalidade: "",
    endereco: "",
    data_abertura: "",
    data_despacho: "",
    data_chegada: "",
    data_conclusao: "",
    id_equipe: "",
    id_viatura: "",
    encarregado: "",
  });

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16); // datetime-local
  };

  const toISOOrNull = (value?: string) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  useEffect(() => {
    const load = async () => {
      if (!codigo) return;
      setLoading(true);
      setErro(null);
      try {
        const { data, error } = await supabase
          .from("acionamentos")
          .select("*")
          .eq("codigo_acionamento", codigo)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setErro("Acionamento nao encontrado");
          return;
        }
        setAcionamento(data);
        setForm({
          status: data.status || "",
          prioridade: data.prioridade || "",
          prioridade_nivel: data.prioridade_nivel || "",
          municipio: data.municipio || "",
          numero_os: data.numero_os || "",
          observacao: (data as any).observacao || "",
          origem: data.origem || "",
          modalidade: data.modalidade || "",
          endereco: data.endereco || "",
          data_abertura: toDateInput(data.data_abertura),
          data_despacho: toDateInput(data.data_despacho),
          data_chegada: toDateInput(data.data_chegada),
          data_conclusao: toDateInput(data.data_conclusao),
          id_equipe: data.id_equipe || "",
          id_viatura: data.id_viatura || "",
          encarregado: (data as any).encarregado || "",
        });
      } catch (err: any) {
        setErro(err.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [codigo]);

  const handleSave = async () => {
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
          origem: form.origem || null,
          modalidade: form.modalidade || null,
          endereco: form.endereco || null,
          data_abertura: toISOOrNull(form.data_abertura),
          data_despacho: toISOOrNull(form.data_despacho),
          data_chegada: toISOOrNull(form.data_chegada),
          data_conclusao: toISOOrNull(form.data_conclusao),
          id_equipe: form.id_equipe || null,
          id_viatura: form.id_viatura || null,
          encarregado: form.encarregado || null,
        })
        .eq("id_acionamento", acionamento.id_acionamento);
      if (error) throw error;
      setInfo("Acionamento atualizado.");
    } catch (err: any) {
      setErro(err.message || "Erro ao salvar");
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
        <div className="text-sm text-destructive">Acionamento nao encontrado.</div>
        <Button asChild variant="outline" className="mt-3">
          <Link to="/acionamentos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acionamento {codigo}</h1>
          <p className="text-sm text-muted-foreground">Edite apenas os dados do acionamento.</p>
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
          <CardDescription>Atualize informacoes principais.</CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Código</Label>
                <Input value={acionamento.codigo_acionamento || ""} disabled />
              </div>
              <div>
                <Label>Origem</Label>
                <Input value={form.origem} onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPCOES.map((st) => (
                      <SelectItem key={st} value={st}>
                        {st}
                      </SelectItem>
                    ))}
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
                <Label>Nível</Label>
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
                <Label>Modalidade</Label>
                <Select value={form.modalidade} onValueChange={(v) => setForm((f) => ({ ...f, modalidade: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LM">LM</SelectItem>
                    <SelectItem value="LV">LV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Município</Label>
                <Input value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} />
              </div>
              <div>
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))} />
              </div>
              <div>
                <Label>Número OS</Label>
                <Input value={form.numero_os} onChange={(e) => setForm((f) => ({ ...f, numero_os: e.target.value }))} />
              </div>
              <div>
                <Label>Equipe (id_equipe)</Label>
                <Input value={form.id_equipe} onChange={(e) => setForm((f) => ({ ...f, id_equipe: e.target.value }))} />
              </div>
              <div>
                <Label>Viatura (id_viatura)</Label>
                <Input value={form.id_viatura} onChange={(e) => setForm((f) => ({ ...f, id_viatura: e.target.value }))} />
              </div>
              <div>
                <Label>Encarregado</Label>
                <Input value={form.encarregado} onChange={(e) => setForm((f) => ({ ...f, encarregado: e.target.value }))} />
              </div>
              <div>
                <Label>Data de abertura</Label>
                <Input
                  type="datetime-local"
                  value={form.data_abertura}
                  onChange={(e) => setForm((f) => ({ ...f, data_abertura: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data de despacho</Label>
                <Input
                  type="datetime-local"
                  value={form.data_despacho}
                  onChange={(e) => setForm((f) => ({ ...f, data_despacho: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data de chegada</Label>
                <Input
                  type="datetime-local"
                  value={form.data_chegada}
                  onChange={(e) => setForm((f) => ({ ...f, data_chegada: e.target.value }))}
                />
              </div>
              <div>
                <Label>Data de conclusão</Label>
                <Input
                  type="datetime-local"
                  value={form.data_conclusao}
                  onChange={(e) => setForm((f) => ({ ...f, data_conclusao: e.target.value }))}
                />
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
