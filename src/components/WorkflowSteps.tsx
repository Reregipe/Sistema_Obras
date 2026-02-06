import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AcionamentoForm } from "@/components/forms/AcionamentoForm";
import { WorkflowSteps } from "@/components/domain/WorkflowSteps";
import { Plus, Download, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Acionamento = {
  codigo_acionamento: string;
  numero_os: string | null;
  status: string | null;
  prioridade: string | null;
  municipio: string | null;
  data_abertura: string | null;
  modalidade: string | null;
};

const statusMap = {
  recebido: "Abertos",
  executando: "Despachados / Execução",
  medir: "Concluídos (medir)",
  os_criada: "Prontos para OS",
};

export default function Acionamentos() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Acionamento[]>([]);
  const [loading, setLoading] = useState(false);

  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    const urgentes: Record<string, number> = {};

    rows.forEach((r) => {
      const st = (r.status || "").toLowerCase();
      const prio = (r.prioridade || "").toLowerCase();
      counts[st] = (counts[st] || 0) + 1;
      if (prio === "urgente") {
        urgentes[st] = (urgentes[st] || 0) + 1;
      }
    });

    return [
      {
        label: "Abertos",
        value: counts["recebido"] || 0,
        badge: urgentes["recebido"] ? `Urgentes: ${urgentes["recebido"]}` : "Urgentes: 0",
        color: "text-primary",
      },
      {
        label: "Despachados / Execução",
        value: counts["executando"] || 0,
        badge: urgentes["executando"] ? `Urgentes: ${urgentes["executando"]}` : "Sem equipe: -",
        color: "text-warning",
      },
      {
        label: "Concluídos (medir)",
        value: counts["medir"] || 0,
        badge: "Pendente orçamento",
        color: "text-muted-foreground",
      },
      {
        label: "Prontos para OS",
        value: counts["os_criada"] || 0,
        badge: "Listas ok",
        color: "text-success",
      },
    ];
  }, [rows]);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("acionamentos")
      .select("codigo_acionamento, numero_os, status, prioridade, municipio, data_abertura, modalidade")
      .order("data_abertura", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Acionamentos</h1>
          <p className="text-muted-foreground">
            Fluxo emergencial/manutenção da Energisa: do recebimento à NF. Use a régua de etapas para acompanhar o dia a dia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={loadData} disabled={loading}>
            <Download className="h-4 w-4" />
            {loading ? "Atualizando..." : "Atualizar"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Acionamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Acionamento</DialogTitle>
                <DialogDescription>Preencha os dados do novo acionamento</DialogDescription>
              </DialogHeader>
              <AcionamentoForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-2">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              <Badge variant="secondary">{item.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Régua de etapas (Acionamentos)</CardTitle>
          <CardDescription>Use os cartões abaixo para abrir os itens filtrados em cada etapa.</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowSteps />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista rápida</CardTitle>
              <CardDescription>Acompanhe os acionamentos em andamento, com OS vinculada.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2" disabled>
              <Filter className="h-4 w-4" />
              Filtros rápidos (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Abertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhum acionamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((item) => (
                    <TableRow key={item.codigo_acionamento}>
                      <TableCell className="font-semibold">{item.codigo_acionamento}</TableCell>
                      <TableCell>{item.numero_os || "--"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status || "--"}</Badge>
                      </TableCell>
                      <TableCell className={(item.prioridade || "").toLowerCase() === "urgente" ? "text-destructive" : ""}>
                        {item.prioridade || "--"}
                      </TableCell>
                      <TableCell>{item.municipio || "--"}</TableCell>
                      <TableCell>
                        {item.data_abertura
                          ? new Date(item.data_abertura).toLocaleDateString("pt-BR")
                          : "--"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
