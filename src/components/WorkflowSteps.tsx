import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
  count: number;
  urgent?: number;
  delayed?: number;
  status: "pending" | "active" | "completed" | "alert";
}

type StepQueryConfig = {
  table: "acionamentos" | "obras";
  filters: { type: "eq" | "in" | "is" | "not" | "or"; column: string; value?: any }[];
};

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Acionamentos recebidos",
    description: "Recebido e lista previa de materiais para o almox",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: "/acionamentos",
    count: 5,
    urgent: 2,
    status: "alert",
  },
  {
    id: 2,
    title: "Acionamentos executados",
    description: "Servico em execucao ou despachado",
    icon: Wrench,
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: "/acionamentos",
    count: 12,
    status: "active",
  },
  {
    id: 3,
    title: "Medir servicos executados",
    description: "Valorizar MO, ajustar materiais e registrar horario (orcamento)",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    route: "/medicoes",
    count: 8,
    delayed: 3,
    status: "alert",
  },
  {
    id: 4,
    title: "Criar OS no sistema",
    description: "OS formal com dados e evidencias",
    icon: CheckCircle2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: "/obras",
    count: 6,
    status: "active",
  },
  {
    id: 5,
    title: "Enviar Book / Aguardando Obra",
    description: "Book com fotos e relatorios",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    route: "/obras",
    count: 4,
    status: "pending",
  },
  {
    id: 6,
    title: "Aprovacao Fiscal",
    description: "Analise de evidencias e conformidade",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    route: "/obras",
    count: 7,
    delayed: 2,
    status: "alert",
  },
  {
    id: 7,
    title: "Obra criada (TCI)",
    description: "TCI emitido e pendencias tratadas",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    route: "/obras",
    count: 3,
    status: "active",
  },
  {
    id: 8,
    title: "Aprovacao da medicao",
    description: "Gestor aprova para pagamento",
    icon: CheckCircle2,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    route: "/medicoes",
    count: 5,
    urgent: 1,
    status: "alert",
  },
  {
    id: 9,
    title: "Geracao de lote",
    description: "Agrupa obras aprovadas",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    route: "/medicoes",
    count: 2,
    status: "pending",
  },
  {
    id: 10,
    title: "Emissao de NF",
    description: "Nota fiscal para concessionaria",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    route: "/medicoes",
    count: 8,
    status: "completed",
  },
];

export const WorkflowSteps = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepConfigs: Record<number, StepQueryConfig> = useMemo(
    () => ({
      // 1. Recebidos
      1: { table: "acionamentos", filters: [{ type: "eq", column: "status", value: "aberto" }] },
      // 2. Executando (despachados ou em execucao)
      2: { table: "acionamentos", filters: [{ type: "in", column: "status", value: ["despachado", "em_execucao"] }] },
      // 3. Medir servicos executados (acionamentos concluidos aguardando orcamento)
    3: {
      table: "acionamentos",
      filters: [{ type: "eq", column: "status", value: "concluido" }],
    },
      // 4. Criar OS no sistema (somente obras que já foram abertas pela Energisa)
      4: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "in", column: "os_status", value: ["gerada", "aberta"] },
        ],
      },
      // 5. Enviar Book / Aguardando Obra (já aberta pela Energisa)
      5: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "in", column: "os_status", value: ["aberta", "enviada"] },
        ],
      },
      // 6. Aprovacao Fiscal (Energisa abriu OS e TCI pendente/nulo)
      6: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "or", column: "tci_status", value: "tci_status.is.null,tci_status.eq.pendente" },
        ],
      },
      // 7. Obra criada (TCI emitido) - já aberta pela Energisa
      7: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "eq", column: "tci_status", value: "emitido" },
        ],
      },
      // 8. Pendente de aprovacao de medicao (gestor) - já aberta pela Energisa
      8: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "eq", column: "gestor_aprovacao_status", value: "aguardando" },
        ],
      },
      // 9. Geracao de lote de pagamento (TCI validado) - já aberta pela Energisa
      9: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "eq", column: "tci_status", value: "validado" },
        ],
      },
      // 10. Emissao de NF (TCI validado, OS aberta pela Energisa, gestor aprovou)
      10: {
        table: "obras",
        filters: [
          { type: "not", column: "os_data_aberta_pela_energisa", value: null },
          { type: "eq", column: "tci_status", value: "validado" },
          { type: "eq", column: "gestor_aprovacao_status", value: "aprovado" },
        ],
      },
    }),
    []
  );

  useEffect(() => {
    if (open && selectedStep) {
      loadItems(selectedStep);
    }
  }, [open, selectedStep]);

  const handleStepClick = (step: WorkflowStep) => {
    setItems([]);
    setError(null);
    setSelectedStep(step);
    setOpen(true);
  };

  const loadItems = async (step: WorkflowStep) => {
    const config = stepConfigs[step.id];
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      let query: any;
      if (config.table === "acionamentos") {
        query = supabase
          .from("acionamentos")
          .select("codigo_acionamento,numero_os,status,prioridade,municipio,modalidade,data_abertura")
          .order("data_abertura", { ascending: false })
          .limit(50);
      } else {
        query = supabase
          .from("obras")
          .select("numero_os,os_numero,codigo_acionamento,os_status,gestor_aprovacao_status,tci_status,os_data_envio_energisa,os_data_abertura,os_data_aberta_pela_energisa")
          .order("os_data_abertura", { ascending: false })
          .limit(50);
      }

      for (const filter of config.filters) {
        if (filter.type === "eq") query = query.eq(filter.column, filter.value);
        if (filter.type === "in") query = query.in(filter.column, filter.value);
        if (filter.type === "is") query = query.is(filter.column, filter.value);
        if (filter.type === "not") query = query.not(filter.column, "is", filter.value);
        if (filter.type === "or" && typeof filter.value === "string") query = query.or(filter.value);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "--";
    return new Date(value).toLocaleDateString("pt-BR");
  };

  const renderItems = () => {
    if (!selectedStep) return null;
    const config = stepConfigs[selectedStep.id];
    if (!config) return null;

    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando itens da etapa...
        </div>
      );
    }

    if (error) {
      return <p className="text-sm text-destructive">Erro: {error}</p>;
    }

    if (!items.length) {
      return <p className="text-sm text-muted-foreground">Nenhum registro encontrado para esta etapa.</p>;
    }

    if (config.table === "acionamentos") {
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.codigo_acionamento}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{item.codigo_acionamento}</div>
                    {item.numero_os && (
                      <div className="text-xs text-muted-foreground">OS: {item.numero_os}</div>
                    )}
                  </div>
                  <Badge>{item.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {item.modalidade} - {item.prioridade} - {item.municipio || "Sem municipio"}
                </div>
                <div className="text-xs text-muted-foreground">Aberto em {formatDate(item.data_abertura)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.numero_os}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-foreground">{item.os_numero || item.numero_os || "Obra sem número"}</div>
                <div className="flex gap-2">
                  <Badge>{item.os_status || "sem status"}</Badge>
                  {item.tci_status && <Badge variant="outline">TCI: {item.tci_status}</Badge>}
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>OS: {item.numero_os || "--"}</div>
                <div>Código acionamento: {item.codigo_acionamento || "--"}</div>
                <div>Gestor: {item.gestor_aprovacao_status || "--"}</div>
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                <span>Abertura: {formatDate(item.os_data_abertura)}</span>
                <span>Envio Energisa: {formatDate(item.os_data_envio_energisa)}</span>
                <span>Aberta pela Energisa: {formatDate(item.os_data_aberta_pela_energisa)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getStatusBadge = (step: WorkflowStep) => {
    if (step.urgent) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          {step.urgent} Urgente{step.urgent > 1 ? "s" : ""}
        </Badge>
      );
    }
    if (step.delayed) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          {step.delayed} Atrasado{step.delayed > 1 ? "s" : ""}
        </Badge>
      );
    }
    if (step.status === "completed") {
      return <Badge className="bg-success text-success-foreground">Concluido</Badge>;
    }
    return null;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Fluxo de Trabalho - Controle de Etapas</CardTitle>
            <CardDescription className="mt-2">
              Acompanhe cada etapa e nao deixe nada para tras. Clique em uma etapa para ver os detalhes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Urgente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span className="text-xs text-muted-foreground">Atrasado</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const hasAlert = step.urgent || step.delayed;

            return (
              <div key={step.id} className="relative group">
                <Card
                  className={cn(
                    "transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1",
                    hasAlert && "border-2 border-destructive"
                  )}
                  onClick={() => handleStepClick(step)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className={cn("p-2 rounded-lg", step.bgColor)}>
                          <Icon className={cn("w-5 h-5", step.color)} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-2xl font-bold text-foreground">{step.count}</div>
                          {getStatusBadge(step)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-muted-foreground mb-1">
                          ETAPA {String(step.id).padStart(2, "0")}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground mt-auto"
                      >
                        Ver detalhes
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border transform -translate-y-1/2 z-10"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">3</div>
                <div className="text-xs text-muted-foreground">Itens Urgentes</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">5</div>
                <div className="text-xs text-muted-foreground">Itens Atrasados</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">60</div>
                <div className="text-xs text-muted-foreground">Total em Andamento</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedStep?.title || "Etapa"}</DialogTitle>
            <DialogDescription>Itens associados a esta etapa do fluxo de trabalho.</DialogDescription>
          </DialogHeader>
          {selectedStep?.id === 1 && (
            <div className="mb-4 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-sm text-muted-foreground">
              Lembrete: ao receber o acionamento, monte a lista de material previa para o almoxarifado disponibilizar a equipe.
            </div>
          )}
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3">
            {renderItems()}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedStep) navigate(selectedStep.route);
                setOpen(false);
              }}
            >
              Ir para {selectedStep?.route}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
