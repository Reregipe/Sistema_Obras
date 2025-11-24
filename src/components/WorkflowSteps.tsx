import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    description: "Solicitações da Energisa por email",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: "/acionamentos",
    count: 5,
    urgent: 2,
    status: "alert"
  },
  {
    id: 2,
    title: "Acionamentos executados",
    description: "Serviços realizados conforme acionamento",
    icon: Wrench,
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: "/acionamentos",
    count: 12,
    status: "active"
  },
  {
    id: 3,
    title: "Medir os serviços",
    description: "Planilha com medições e materiais",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    route: "/medicoes",
    count: 8,
    delayed: 3,
    status: "alert"
  },
  {
    id: 4,
    title: "Criar OS no sistema",
    description: "Gera OS formal com evidências",
    icon: CheckCircle2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: "/obras",
    count: 6,
    status: "active"
  },
  {
    id: 5,
    title: "Enviar Book / Aguardando",
    description: "Book com fotos e relatórios",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    route: "/obras",
    count: 4,
    status: "pending"
  },
  {
    id: 6,
    title: "Aprovação Fiscal",
    description: "Energisa analisa e valida",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    route: "/obras",
    count: 7,
    delayed: 2,
    status: "alert"
  },
  {
    id: 7,
    title: "Obra criada (TCI)",
    description: "Montar TCI e tratar pendências",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    route: "/obras",
    count: 3,
    status: "active"
  },
  {
    id: 8,
    title: "Aprovação da medição",
    description: "Gestor aprova a medição",
    icon: CheckCircle2,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    route: "/medicoes",
    count: 5,
    urgent: 1,
    status: "alert"
  },
  {
    id: 9,
    title: "Geração de lote",
    description: "Agrupa obras aprovadas",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    route: "/medicoes",
    count: 2,
    status: "pending"
  },
  {
    id: 10,
    title: "Emissão de NF",
    description: "Nota fiscal para Concessionária",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    route: "/medicoes",
    count: 8,
    status: "completed"
  }
];

export const WorkflowSteps = () => {
  const navigate = useNavigate();

  const getStatusBadge = (step: WorkflowStep) => {
    if (step.urgent) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          {step.urgent} Urgente{step.urgent > 1 ? 's' : ''}
        </Badge>
      );
    }
    if (step.delayed) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          {step.delayed} Atrasado{step.delayed > 1 ? 's' : ''}
        </Badge>
      );
    }
    if (step.status === "completed") {
      return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
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
              Acompanhe cada etapa e não deixe nada para trás. Clique em uma etapa para ver os detalhes.
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
              <div 
                key={step.id}
                className="relative group"
              >
                <Card 
                  className={cn(
                    "transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1",
                    hasAlert && "border-2 border-destructive"
                  )}
                  onClick={() => navigate(step.route)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* Header with icon and count */}
                      <div className="flex items-start justify-between">
                        <div className={cn("p-2 rounded-lg", step.bgColor)}>
                          <Icon className={cn("w-5 h-5", step.color)} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-2xl font-bold text-foreground">
                            {step.count}
                          </div>
                          {getStatusBadge(step)}
                        </div>
                      </div>

                      {/* Step number and title */}
                      <div>
                        <div className="text-xs font-bold text-muted-foreground mb-1">
                          ETAPA {String(step.id).padStart(2, '0')}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.description}
                        </p>
                      </div>

                      {/* Action button */}
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

                {/* Arrow connector */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border transform -translate-y-1/2 z-10"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary alerts */}
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
    </Card>
  );
};
