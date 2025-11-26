import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, ArrowRight } from "lucide-react";

const Obras = () => {
  const kpis = useMemo(
    () => [
      { label: "Planejamento", value: "4" },
      { label: "Execução", value: "7" },
      { label: "TCI pendente", value: "2" },
      { label: "Prontas p/ NF", value: "3" },
    ],
    [],
  );

  const etapas = useMemo(
    () => [
      { title: "Planejamento", desc: "Escopo, cronograma e orçamento", status: "em andamento" },
      { title: "Execução", desc: "Equipe em campo, medições parciais", status: "7 obras" },
      { title: "Medições parciais", desc: "Consolidar MO/material", status: "3 pendentes" },
      { title: "TCI / Tratativas", desc: "Ajustes e pendências", status: "2 TCI pendentes" },
      { title: "Aprovação", desc: "Gestor/Fiscal", status: "4 aguardando" },
      { title: "Faturamento", desc: "Lote / NF", status: "3 prontas" },
    ],
    [],
  );

  const obras = useMemo(
    () => [
      {
        obra: "OBRA-LP-001",
        os: "OS-LP-2301",
        status: "execucao",
        tci: "pendente",
        gestor: "aguardando",
        cidade: "Cuiaba",
        inicio: "10/11/2025",
      },
      {
        obra: "OBRA-LP-002",
        os: "OS-LP-2305",
        status: "medicao",
        tci: "emitido",
        gestor: "aguardando",
        cidade: "Varzea Grande",
        inicio: "05/11/2025",
      },
      {
        obra: "OBRA-LP-003",
        os: "OS-LP-2310",
        status: "tci",
        tci: "pendente",
        gestor: "pendente",
        cidade: "Cuiaba",
        inicio: "28/10/2025",
      },
      {
        obra: "OBRA-LP-004",
        os: "OS-LP-2315",
        status: "faturar",
        tci: "validado",
        gestor: "aprovado",
        cidade: "Primavera",
        inicio: "20/10/2025",
      },
    ],
    [],
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Obras (longo prazo)</h1>
          <p className="text-muted-foreground">
            Acompanhe obras planejadas da concepção ao faturamento. Sempre por número da obra (Energisa) e OS interna.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Obra
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Régua de etapas (Obras longo prazo)</CardTitle>
          <CardDescription>Visual rápido do progresso. Clique para detalhar (em breve).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {etapas.map((etapa) => (
            <div key={etapa.title} className="rounded-lg border p-4 hover:border-primary transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-foreground">{etapa.title}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{etapa.desc}</p>
              <div className="mt-2">
                <Badge variant="secondary">{etapa.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de obras</CardTitle>
              <CardDescription>Obras de longo prazo com OS interna e status de TCI/Aprovação.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Filtros avançados (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra (Energisa)</TableHead>
                <TableHead>OS (interna)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TCI</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((item) => (
                <TableRow key={item.obra}>
                  <TableCell className="font-semibold">{item.obra}</TableCell>
                  <TableCell>{item.os}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.tci === "validado" ? "default" : "outline"}>{item.tci}</Badge>
                  </TableCell>
                  <TableCell>{item.gestor}</TableCell>
                  <TableCell>{item.cidade}</TableCell>
                  <TableCell>{item.inicio}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Obras;
