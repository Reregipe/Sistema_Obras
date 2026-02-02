import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { equipesCatalog } from "@/data/equipesCatalog";

const DEFAULT_EQUIPES = equipesCatalog.map((team) => team.code);

const obras = [
  "OBRA-PLANEJAMENTO",
  "OBRA-EXECUCAO",
  "OBRA-MEDICAO",
  "OBRA-TCI",
  "OBRA-APROVACAO",
];

type Localizacao = {
  obra: string;
  anotacao: string;
  status: "confirmado" | "em ajuste" | "aguardando" | "";
};

const buildInitialState = (lista: string[]) =>
  lista.reduce<Record<string, Localizacao>>((acc, equipe) => {
    acc[equipe] = {
      obra: "",
      anotacao: "",
      status: "",
    };
    return acc;
  }, {} as Record<string, Localizacao>);

const Alocacao = () => {
  const [dataBase, setDataBase] = useState(new Date().toISOString().split("T")[0]);
  const [registros, setRegistros] = useState<Record<string, Localizacao>>(() => buildInitialState(DEFAULT_EQUIPES));
  const [listaEquipes, setListaEquipes] = useState<string[]>(DEFAULT_EQUIPES);

  const resumo = useMemo(
    () => Object.values(registros).reduce(
      (acc, entry) => {
        acc[entry.status] += 1;
        return acc;
      },
      { confirmado: 0, "em ajuste": 0, aguardando: 0 }
    ),
    [registros]
  );

  const handleChange = (equipe: string, field: keyof Localizacao, value: string) => {
    setRegistros((prev) => ({
      ...prev,
      [equipe]: {
        ...prev[equipe],
        [field]: value,
      },
    }));
  };

  const handleSalvar = () => {
    console.info("Apontamento salvo", registros);
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("equipes").select("nome").eq("ativa", true);
      if (error || !data) return;
      const nomes = data.map((item: any) => item.nome);
      if (nomes.length === 0) return;
      setListaEquipes(nomes);
      setRegistros((prev) => {
        const novo = { ...prev };
        nomes.forEach((nome, index) => {
          novo[nome] = prev[nome] || {
            obra: obras[index % obras.length],
            anotacao: "",
            status: "aguardando",
          };
        });
        return novo;
      });
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Alocação diária</p>
          <h1 className="text-2xl font-bold">Apontamento da equipe</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data base</label>
          <Input type="date" value={dataBase} onChange={(event) => setDataBase(event.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">Confirmado: {resumo.confirmado}</Badge>
        <Badge variant="secondary">Em ajuste: {resumo["em ajuste"]}</Badge>
        <Badge variant="secondary">Aguardando: {resumo.aguardando}</Badge>
      </div>
      <Separator />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {listaEquipes.map((equipe) => (
          <Card key={equipe} className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">{equipe}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Obra em foco</label>
                <select
                  value={registros[equipe]?.obra ?? ""}
                  onChange={(event) => handleChange(equipe, "obra", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {obras.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Status do apontamento</label>
                <select
                  value={registros[equipe]?.status ?? ""}
                  onChange={(event) => handleChange(equipe, "status", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="em ajuste">Em ajuste</option>
                  <option value="aguardando">Aguardando</option>
                </select>
              </div>
              <div className="space-y-1 text-sm font-medium text-muted-foreground">
                <label>Anotação rápida</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={registros[equipe].anotacao}
                  onChange={(event) => handleChange(equipe, "anotacao", event.target.value)}
                  placeholder="Descreva o ponto de apoio, logística ou pendência"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSalvar}>Salvar apontamento</Button>
      </div>
    </div>
  );
};

export default Alocacao;
