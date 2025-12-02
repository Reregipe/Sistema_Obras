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
  });

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
