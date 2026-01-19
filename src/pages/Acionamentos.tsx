import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

type Acionamento = {
  codigo_acionamento: string;
  numero_os: string | null;
  status: string | null;
  prioridade: string | null;
  municipio: string | null;
  data_abertura: string | null;
  modalidade: string | null;
};

const statusMap: Record<string, string> = {
  recebido: "Abertos",
  executando: "Despachados / Execução",
  em_execucao: "Despachados / Execução",
  medir: "Concluídos (medir)",
  os_criada: "Prontos para OS",
  concluido: "Concluído",
  "concluído": "Concluído",
  enviado: "Abertos",
  aprovado: "Aprovação",
};

export default function Acionamentos() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Acionamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sortedRows = useMemo(() => {
    const priorityScore = (item: Acionamento) =>
      (item.prioridade || "").toLowerCase() === "urgente" ? 0 : 1;

    return [...rows].sort((a, b) => {
      const scoreDiff = priorityScore(b) - priorityScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      const dateA = a.data_abertura ? new Date(a.data_abertura).getTime() : 0;
      const dateB = b.data_abertura ? new Date(b.data_abertura).getTime() : 0;
      return dateB - dateA;
    });
  }, [rows]);

  const showQuickList = false;

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedRows;
    return sortedRows.filter((item) => {
      const fields = [
        item.codigo_acionamento,
        item.numero_os,
        item.status,
        item.prioridade,
        item.municipio,
        item.modalidade,
      ];
      return fields.some((value) =>
        value?.toLowerCase().includes(term) ?? false
      );
    });
  }, [searchTerm, sortedRows]);

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

      <WorkflowSteps />

      {showQuickList && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista rápida</CardTitle>
                <CardDescription>Acompanhe os acionamentos em andamento, com OS vinculada.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-2" disabled>
                <Input
                  placeholder="Buscar por código, status, prioridade, município..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="max-w-lg"
                />
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
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Etapa atual</TableHead>
                    <TableHead>Abertura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhum acionamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRows.map((item) => {
                      const isUrgent =
                        (item.prioridade || "").toLowerCase() === "urgente";
                      const statusKey = (item.status || "").toLowerCase();
                      const etapaLabel =
                        statusMap[statusKey] || item.status || "--";
                      const isCompleted = etapaLabel
                        .toLowerCase()
                        .includes("conclu");
                      const rowClass = isCompleted
                        ? "bg-emerald-50/60 cursor-pointer"
                        : isUrgent
                        ? "bg-destructive/10 cursor-pointer"
                        : "cursor-pointer";
                      return (
                        <TableRow
                          key={item.codigo_acionamento}
                          className={`${rowClass} transition-colors cursor-pointer`}
                          onClick={() =>
                            navigate(`/acionamentos/${item.codigo_acionamento}`)
                          }
                        >
                          <TableCell className="font-semibold">{item.codigo_acionamento}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={isUrgent ? "text-destructive" : undefined}>
                              {(item.status || "--").replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className={isUrgent ? "text-destructive" : undefined}>
                            {item.prioridade || "--"}
                          </TableCell>
                          <TableCell>{item.municipio || "--"}</TableCell>
                          <TableCell>{item.modalidade || "--"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="px-2 text-xs">
                              {etapaLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.data_abertura
                              ? new Date(item.data_abertura).toLocaleDateString("pt-BR")
                              : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


