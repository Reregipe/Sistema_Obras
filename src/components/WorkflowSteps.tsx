import { useEffect, useState } from "react";
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

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Acionamentos recebidos",
    description: "Recebido e lista previa de materiais para o almox",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: "/acionamentos",
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
    count: 0,
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
  const [steps, setSteps] = useState<WorkflowStep[]>(workflowSteps);

  useEffect(() => {
    if (open && selectedStep) {
      loadItems(selectedStep);
    }
  }, [open, selectedStep]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const updated = await Promise.all(
          steps.map(async (step) => {
            const { count, error } = await supabase
              .from("acionamentos")
              .select("id_acionamento", { count: "exact", head: true })
              .eq("etapa_atual", step.id);
            if (error) throw error;
            return { ...step, count: count || 0 };
          })
        );
        setSteps(updated);
      } catch (err) {
        console.error("Erro ao contar etapas", err);
      }
    };
    fetchCounts();
  }, []);

  const loadItems = async (step: WorkflowStep) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("acionamentos")
        .select(
          "id_acionamento,codigo_acionamento,numero_os,status,prioridade,municipio,modalidade,data_abertura,etapa_atual"
        )
        .eq("etapa_atual", step.id)
        .order("data_abertura", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar itens da etapa.");
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setOpen(true);
  };

  const getStatusBadge = (step: WorkflowStep) => {
    const statusMap: Record<WorkflowStep["status"], string> = {
      pending: "bg-muted text-muted-foreground",
      active: "bg-primary/10 text-primary border border-primary/20",
      completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      alert: "bg-destructive/10 text-destructive border border-destructive/20",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", statusMap[step.status])}>
        {step.status === "completed" ? "Concluído" : step.status === "active" ? "Em andamento" : step.status === "alert" ? "Alerta" : "Pendente"}
      </Badge>
    );
  };

  const renderItems = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando itens...
        </div>
      );
    }
    if (error) {
      return <div className="text-sm text-destructive">{error}</div>;
    }
    if (items.length === 0) {
      return <div className="text-sm text-muted-foreground">Nenhum item nesta etapa.</div>;
    }

    return items.map((item) => (
      <div
        key={item.id_acionamento}
        className="border border-border rounded-lg p-3 space-y-2 hover:bg-accent transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="cursor-pointer" onClick={() => navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`)}>
            <div className="font-semibold text-foreground">
              {item.codigo_acionamento || item.id_acionamento}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.municipio || "--"} • {item.modalidade || "--"}
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {item.status || "--"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigate(`/acionamentos/${item.id_acionamento || item.codigo_acionamento}/materials`);
              setOpen(false);
            }}
          >
            Lista de materiais
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`);
              setOpen(false);
            }}
          >
            Editar acionamento
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <Card>
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
          {steps.map((step, index) => {
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

                {index < steps.length - 1 && (
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
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3">{renderItems()}</div>
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
