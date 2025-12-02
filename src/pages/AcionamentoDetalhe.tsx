import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AcionamentoRow = Database["public"]["Tables"]["acionamentos"]["Row"];

const STATUS_OPCOES = ["concluido", "em_andamento", "pendente", "cancelado", "programado"];
const PRIORIDADE_OPCOES = ["emergencia", "programado"];
const PRIORIDADE_NIVEL_OPCOES = ["normal", "media", "alta"];
const MODALIDADE_OPCOES = ["LM", "LV", "LM+LV"];

export default function AcionamentoDetalhe() {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [acionamento, setAcionamento] = useState<AcionamentoRow | null>(null);

  const [form, setForm] = useState({
    codigo_acionamento: "",
    prioridade: "",
    prioridade_nivel: "",
    modalidade: "",
    encarregado: "",
    elemento_id: "",
    tipo_atividade: "",
    status: "",
    numero_os: "",
    observacao: "",
    municipio: "",
    data_abertura: "",
    email_msg: "",
  });

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
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
          codigo_acionamento: data.codigo_acionamento || "",
          prioridade: data.prioridade || "",
          prioridade_nivel: data.prioridade_nivel || "",
          modalidade: data.modalidade || "",
          encarregado: (data as any).encarregado || "",
          elemento_id: (data as any).elemento_id || "",
          tipo_atividade: (data as any).tipo_atividade || "",
          status: data.status || "",
          numero_os: data.numero_os || "",
          observacao: (data as any).observacao || "",
          municipio: data.municipio || "",
          data_abertura: toDateInput(data.data_abertura),
          email_msg: (data as any).email_msg || "",
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
          prioridade: form.prioridade || null,
          prioridade_nivel: form.prioridade_nivel || null,
          modalidade: form.modalidade || null,
          encarregado: form.encarregado || null,
          elemento_id: form.elemento_id || null,
          tipo_atividade: form.tipo_atividade || null,
          status: form.status || null,
          numero_os: form.numero_os || null,
          observacao: form.observacao || null,
          municipio: form.municipio || null,
          data_abertura: toISOOrNull(form.data_abertura),
          email_msg: form.email_msg || null,
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
        <div className="flex-1 text-center space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Acionamento {codigo}</h1>
          <p className="text-sm text-muted-foreground">Edite apenas os dados do acionamento.</p>
        </div>
        <div className="ml-4">
          <Button asChild variant="outline">
            <Link to="/acionamentos">Voltar</Link>
          </Button>
        </div>
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
          <CardDescription>Atualize apenas os campos do acionamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Código</Label>
              <Input value={form.codigo_acionamento} disabled />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm((f) => ({ ...f, prioridade: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADE_OPCOES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
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
                  {PRIORIDADE_NIVEL_OPCOES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
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
                  {MODALIDADE_OPCOES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Encarregado</Label>
              <Input value={form.encarregado} onChange={(e) => setForm((f) => ({ ...f, encarregado: e.target.value }))} />
            </div>
            <div>
              <Label>Elemento / ID</Label>
              <Input value={form.elemento_id} onChange={(e) => setForm((f) => ({ ...f, elemento_id: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo de atividade</Label>
              <Input
                value={form.tipo_atividade}
                onChange={(e) => setForm((f) => ({ ...f, tipo_atividade: e.target.value }))}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPCOES.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número OS</Label>
              <Input value={form.numero_os} onChange={(e) => setForm((f) => ({ ...f, numero_os: e.target.value }))} />
            </div>
            <div>
              <Label>Município</Label>
              <Input value={form.municipio} onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))} />
            </div>
            <div>
              <Label>Data de abertura</Label>
              <Input
                type="date"
                value={form.data_abertura}
                onChange={(e) => setForm((f) => ({ ...f, data_abertura: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Observação</Label>
              <Textarea
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Email (.msg)</Label>
              <Input
                type="file"
                accept=".msg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setForm((f) => ({ ...f, email_msg: "" }));
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result as string;
                    setForm((f) => ({ ...f, email_msg: result }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Anexe o email original em formato .msg para manter o histórico no sistema.
              </p>
            </div>
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
