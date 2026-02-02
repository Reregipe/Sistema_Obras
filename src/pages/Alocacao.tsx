import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { equipesCatalog } from "@/data/equipesCatalog";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_EQUIPES = equipesCatalog.map((team) => team.code);
const DEFAULT_OBRAS = [
  "OBRA-PLANEJAMENTO",
  "OBRA-EXECUCAO",
];

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  const [obrasDisponiveis, setObrasDisponiveis] = useState<string[]>(DEFAULT_OBRAS);
  const [carregandoEquipes, setCarregandoEquipes] = useState(false);
  const [carregandoObras, setCarregandoObras] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const resumo = useMemo(() => {
    const totals = { confirmado: 0, "em ajuste": 0, aguardando: 0 };
    Object.values(registros).forEach((entry) => {
      if (entry.status && entry.status in totals) {
        totals[entry.status as keyof typeof totals] += 1;
      }
    });
    return totals;
  }, [registros]);

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
    setModalAberto(false);
  };

  const daysInCalendar = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = firstDayOfMonth.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }).map((_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        date,
        currentMonth: date.getMonth() === month,
      };
    });
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + offset);
      next.setDate(1);
      return next;
    });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setModalAberto(true);
  };

  const monthLabel = currentMonth.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  useEffect(() => {
    const loadEquipes = async () => {
      setCarregandoEquipes(true);
      try {
        const { data, error } = await supabase.from("equipes").select("nome").eq("ativa", true);
        if (!error && data && data.length > 0) {
          const nomes = data.map((item: any) => item.nome);
          setListaEquipes(nomes);
          setRegistros((prev) => {
            const novo = { ...prev };
            nomes.forEach((nome) => {
              novo[nome] = prev[nome] || {
                obra: "",
                anotacao: "",
                status: "",
              };
            });
            return novo;
          });
        }
      } finally {
        setCarregandoEquipes(false);
      }
    };
    const loadObrasDisponiveis = async () => {
      setCarregandoObras(true);
      try {
        const { data, error } = await supabase
          .from("obras")
          .select("obra")
          .in("status", ["planejamento", "execucao"]);
        if (!error && data && data.length > 0) {
          setObrasDisponiveis(data.map((item: any) => item.obra));
        }
      } finally {
        setCarregandoObras(false);
      }
    };
    loadEquipes();
    loadObrasDisponiveis();
  }, []);

  const carregando = carregandoEquipes || carregandoObras;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Alocação diária</p>
          <h1 className="text-2xl font-bold">Apontamento da equipe</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold tracking-wider text-muted-foreground">Data base</label>
          <Input type="date" value={dataBase} onChange={(event) => setDataBase(event.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary">Confirmado: {resumo.confirmado}</Badge>
        <Badge variant="secondary">Em ajuste: {resumo["em ajuste"]}</Badge>
        <Badge variant="secondary">Aguardando: {resumo.aguardando}</Badge>
      </div>
      <Separator />
      <div className="space-y-4 rounded-2xl border border-muted/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted-foreground">Calendário</p>
            <p className="text-lg font-semibold capitalize">{monthLabel}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="gap-1" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
              Mês anterior
            </Button>
            <Button variant="ghost" className="gap-1" onClick={() => changeMonth(1)}>
              Próximo mês
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {daysInCalendar.map(({ date, currentMonth: inMonth }) => {
            const today = sameDay(date, new Date());
            const selected = sameDay(date, selectedDate);
            return (
              <button
                type="button"
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                className={`flex h-14 flex-col items-center justify-center rounded-lg border px-1 text-center transition ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : inMonth
                    ? "border-border bg-background"
                    : "border-transparent bg-muted/20 text-muted-foreground"
                } ${today && !selected ? "font-semibold" : "font-normal"}`}
              >
                <span className="text-base">{date.getDate()}</span>
                <span className="text-[10px] uppercase">{today ? "hoje" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
      {carregando && <p className="text-sm text-muted-foreground">Carregando equipes e obras...</p>}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Apontamento ·{" "}
              {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
                      {obrasDisponiveis.map((obra) => (
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
          <DialogFooter>
            <div />
            <Button onClick={handleSalvar}>Salvar apontamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alocacao;
