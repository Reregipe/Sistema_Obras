import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const equipes = [
  "Linha Viva - LV01",
  "Linha Morta - LM02",
  "LM/LV - ML03",
  "Equipe Apoio",
];

const obrasDisponiveis = [
  "OBRA-PLANEJAMENTO",
  "OBRA-EXECUCAO",
  "OBRA-MEDICAO",
  "OBRA-TCI",
];

type Assignment = {
  equipe: string;
  obra: string;
  observacao: string;
  status: "em campo" | "aguardando" | "finalizado";
};

const buildInitialAssignments = (): Assignment[] =>
  equipes.map((equipe, index) => ({
    equipe,
    obra: obrasDisponiveis[index % obrasDisponiveis.length],
    observacao: "",
    status: index % 3 === 0 ? "em campo" : index % 3 === 1 ? "aguardando" : "finalizado",
  }));

const Producao = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(() => buildInitialAssignments());
  const [dataBase, setDataBase] = useState<string>(new Date().toISOString().split("T")[0]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const resumo = useMemo(
    () => ({
      emCampo: assignments.filter((item) => item.status === "em campo").length,
      aguardando: assignments.filter((item) => item.status === "aguardando").length,
      finalizado: assignments.filter((item) => item.status === "finalizado").length,
    }),
    [assignments]
  );

  const handleAssignmentChange = (equipe: string, field: keyof Assignment, value: string) => {
    setAssignments((prev) =>
      prev.map((item) => (item.equipe === equipe ? { ...item, [field]: value } : item))
    );
  };

  const handleSalvarProducao = () => {
    setSavedAt(new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Produção</p>
            <h1 className="text-2xl font-bold">Resumo diário da produção</h1>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-muted/40 bg-muted/50 px-4 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data base</label>
            <Input
              type="date"
              value={dataBase}
              onChange={(event) => setDataBase(event.target.value)}
              className="max-w-[160px]"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge variant="secondary">Em campo: {resumo.emCampo}</Badge>
          <Badge variant="secondary">Aguardando: {resumo.aguardando}</Badge>
          <Badge variant="secondary">Finalizado: {resumo.finalizado}</Badge>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {assignments.map((item) => (
          <Card key={item.equipe} className="space-y-3 border">
            <CardHeader>
              <CardTitle>{item.equipe}</CardTitle>
              <CardDescription>Atualize a obra que está atendendo hoje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Obra em foco</label>
                <select
                  value={item.obra}
                  onChange={(event) => handleAssignmentChange(item.equipe, "obra", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {obrasDisponiveis.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Status</label>
                <select
                  value={item.status}
                  onChange={(event) => handleAssignmentChange(item.equipe, "status", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="em campo">Em campo</option>
                  <option value="aguardando">Aguardando</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Observações rápidas</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={item.observacao}
                  onChange={(event) => handleAssignmentChange(item.equipe, "observacao", event.target.value)}
                  placeholder="Descreva algo rápido"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Atualizado{savedAt ?  em  : " ainda não"}.
        </div>
        <Button onClick={handleSalvarProducao}>Salvar apontamento</Button>
      </div>
    </div>
  );
};

export default Producao;
