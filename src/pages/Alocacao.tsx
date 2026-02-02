import { useEffect, useMemo, useState } from  react;
import { Card, CardContent, CardHeader, CardTitle } from @/components/ui/card;
import { Button } from @/components/ui/button;
import { Input } from @/components/ui/input;
import { Separator } from @/components/ui/separator;
import { Badge } from @/components/ui/badge;
import { Dialog, DialogContent, DialogHeader, DialogTitle } from @/components/ui/dialog;
import { supabase } from @/integrations/supabase/client;
import { equipesCatalog } from @/data/equipesCatalog;
import { ChevronLeft, ChevronRight } from lucide-react;

const DEFAULT_EQUIPES = equipesCatalog.map((team) => team.code);
const DEFAULT_OBRAS = [
  OBRA-PLANEJAMENTO,
  OBRA-EXECUCAO,
];

const WEEKDAYS = [Dom, Seg, Ter, Qua, Qui, Sex, Sáb];

type Localizacao = {
  obra: string;
  anotacao: string;
  status: confirmado | em ajuste | aguardando | ;
};

const buildInitialState = (lista: string[]) =>
 lista.reduce<Record<string, Localizacao>>((acc, equipe) => {
 acc[equipe] = {
 obra: ,
      anotacao: ,
 status: ,
    };
    return acc;
  }, {} as Record<string, Localizacao>);

const getMonthDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days: Array<{ label: number | null; value: Date | null }> = [];
  for (let i = 0; i < startDay.getDay(); i += 1) {
    days.push({ label: null, value: null });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    days.push({ label: day, value: new Date(year, month, day) });
  }
  return days;
};

const Alocacao = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [registros, setRegistros] = useState<Record<string, Localizacao>>(() => buildInitialState(DEFAULT_EQUIPES));
  const [listaEquipes, setListaEquipes] = useState<string[]>(DEFAULT_EQUIPES);
  const [obrasDisponiveis, setObrasDisponiveis] = useState<string[]>(DEFAULT_OBRAS);
  const [carregandoEquipes, setCarregandoEquipes] = useState(false);
  const [carregandoObras, setCarregandoObras] = useState(false);

  const resumo = useMemo(
    () =>
      Object.values(registros).reduce(
        (acc, entry) => {
          acc[entry.status] += 1;
          return acc;
        },
        { confirmado: 0, em ajuste: 0, aguardando: 0 }
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

  const loadEquipes = async () => {
    setCarregandoEquipes(true);
    try {
      const { data, error } = await supabase.from(equipes).select(nome).eq(ativa, true);
      if (!error && data && data.length > 0) {
        const nomes = data.map((item: any) => item.nome);
        setListaEquipes(nomes);
        setRegistros((prev) => {
          const novo = { ...prev };
          nomes.forEach((nome) => {
            if (!novo[nome]) {
              novo[nome] = { obra: , anotacao: , status:  };
 }
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
 .from(obras)
 .select(obra)
 .in(status, [planejamento, execucao]);
 if (!error && data && data.length > 0) {
 setObrasDisponiveis(data.map((item: any) => item.obra));
 }
 } finally {
 setCarregandoObras(false);
 }
 };

 useEffect(() => {
 loadEquipes();
 loadObrasDisponiveis();
 }, []);

 const carregando = carregandoEquipes || carregandoObras;
 const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
 const formattedMonth = currentMonth.toLocaleString(pt-BR, { month: long, year: numeric });

 const handleDayClick = (day: Date | null) => {
 if (!day) return;
 setSelectedDate(day);
 setModalOpen(true);
 };

 const handlePrevMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
 const handleNextMonth = () => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

 return (
 <div className=space-y-6>
 <div className=flex flex-col gap-2 md:flex-row md:items-center md:justify-between>
 <div>
 <p className=text-sm text-muted-foreground>Alocação diária</p>
 <h1 className=text-2xl font-bold>Escolha um dia no calendário</h1>
 </div>
 <div className=flex items-center gap-2 rounded-md border border-muted/40 bg-muted/50 px-3 py-2>
 <Button variant=ghost size=sm onClick={handlePrevMonth}>
 <ChevronLeft className=h-4 w-4 />
 </Button>
 <span className=text-sm font-semibold uppercase tracking-wide>{formattedMonth}</span>
 <Button variant=ghost size=sm onClick={handleNextMonth}>
 <ChevronRight className=h-4 w-4 />
 </Button>
 </div>
 </div>

 <Separator />

 <div className=grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground>
 {WEEKDAYS.map((day) => (
 <div key={day}>{day}</div>
 ))}
 </div>
 <div className=grid grid-cols-7 gap-2>
 {monthDays.map((day, idx) => (
 <button
 key={${idx}-}
 className={h-10 rounded-md border transition-colors }
 disabled={!day.label}
 onClick={() => handleDayClick(day.value)}
 >
 {day.label ?? }
          </button>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className=max-w-4xl>
          <DialogHeader>
            <DialogTitle>
              Apontamento de {selectedDate?.toLocaleDateString(pt-BR, { weekday: long, day: numeric, month: long })}
            </DialogTitle>
            <p className=text-sm text-muted-foreground mt-1>Escolha a obra e status para cada equipe.</p>
          </DialogHeader>
          <div className=space-y-4>
            <div className=flex flex-wrap gap-2>
              <Badge variant=secondary>Confirmado: {resumo.confirmado}</Badge>
              <Badge variant=secondary>Em ajuste: {resumo[em ajuste]}</Badge>
              <Badge variant=secondary>Aguardando: {resumo.aguardando}</Badge>
            </div>
            <Separator />
            <div className=grid gap-4 grid-cols-1 md:grid-cols-2>
              {listaEquipes.map((equipe) => (
                <Card key={equipe} className=border shadow-sm>
                  <CardHeader>
                    <CardTitle className=text-lg>{equipe}</CardTitle>
                  </CardHeader>
                  <CardContent className=space-y-3>
                    <div className=space-y-1 text-sm font-medium text-muted-foreground>
                      <label>Obra em foco</label>
                      <select
                        value={registros[equipe]?.obra ?? }
 onChange={(event) => handleChange(equipe, obra, event.target.value)}
 disabled={carregando}
 className=w-full rounded-md border border-border bg-background px-3 py-2 text-sm
 >
 <option value=>Selecione</option>
                        {obrasDisponiveis.map((obra) => (
                          <option key={obra} value={obra}>
                            {obra}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className=space-y-1 text-sm font-medium text-muted-foreground>
                      <label>Status do apontamento</label>
                      <select
                        value={registros[equipe]?.status ?? }
 onChange={(event) => handleChange(equipe, status, event.target.value)}
 disabled={carregando}
 className=w-full rounded-md border border-border bg-background px-3 py-2 text-sm
 >
 <option value=>Selecione</option>
                        <option value=confirmado>Confirmado</option>
                        <option value=em ajuste>Em ajuste</option>
                        <option value=aguardando>Aguardando</option>
                      </select>
                    </div>
                    <div className=space-y-1 text-sm font-medium text-muted-foreground>
                      <label>Anotação rápida</label>
                      <textarea
                        rows={2}
                        className=w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring
                        value={registros[equipe].anotacao}
                        onChange={(event) => handleChange(equipe, anotacao, event.target.value)}
                        placeholder=Descreva o ponto de apoio logística ou pendência
                        disabled={carregando}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className=flex justify-end gap-2 mt-4>
            <Button variant=outline onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleSalvar} disabled={carregando}>
              Salvar apontamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Alocacao;
