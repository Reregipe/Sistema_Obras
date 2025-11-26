import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AcionamentoForm } from "@/components/forms/AcionamentoForm";
import { WorkflowSteps } from "@/components/WorkflowSteps";
import { Plus, Download, Filter } from "lucide-react";

const Acionamentos = () => {
  const [open, setOpen] = useState(false);
  const kpis = useMemo(
    () => [
      { label: "Abertos", value: "22", badge: "Urgentes: 4", color: "text-primary" },
      { label: "Despachados / Execução", value: "13", badge: "Sem equipe: 3", color: "text-warning" },
      { label: "Concluídos (medir)", value: "8", badge: "Pendente orçamento", color: "text-muted-foreground" },
      { label: "Prontos para OS", value: "5", badge: "Listas ok", color: "text-success" },
    ],
    [],
  );

  const list = useMemo(
    () => [
      {
        codigo: "AC-DEMO-021",
        os: "OS-AC-0021",
        obra: "OS-DEMO-105",
        status: "despachado",
        prioridade: "emergencia",
        cidade: "Varzea Grande",
        abertura: "23/11/2025",
      },
      {
        codigo: "AC-DEMO-027",
        os: "OS-AC-0027",
        obra: "OS-DEMO-108",
        status: "em_execucao",
        prioridade: "programado",
        cidade: "Cuiaba",
        abertura: "23/11/2025",
      },
      {
        codigo: "AC-DEMO-009",
        os: "OS-AC-0009",
        obra: "OS-DEMO-101",
        status: "aberto",
        prioridade: "emergencia",
        cidade: "Varzea Grande",
        abertura: "24/11/2025",
      },
      {
        codigo: "AC-DEMO-016",
        os: "OS-AC-0016",
        obra: "OS-DEMO-106",
        status: "concluido",
        prioridade: "programado",
        cidade: "Cuiaba",
        abertura: "24/11/2025",
      },
    ],
    [],
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Acionamentos</h1>
          <p className="text-muted-foreground">
            Fluxo emergencial/manutenção da Energisa: do recebimento à NF. Use a régua de etapas para acompanhar o dia a dia.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
              <CardDescription>Acompanhe os acionamentos em andamento, com OS e obra vinculadas.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros rápidos (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Abertura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.codigo}>
                  <TableCell className="font-semibold">{item.codigo}</TableCell>
                  <TableCell>{item.os}</TableCell>
                  <TableCell>{item.obra}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "em_execucao" ? "default" : "secondary"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className={item.prioridade === "emergencia" ? "text-destructive" : ""}>
                    {item.prioridade}
                  </TableCell>
                  <TableCell>{item.cidade}</TableCell>
                  <TableCell>{item.abertura}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Acionamentos;
