import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp } from "lucide-react";
import { QuickAccessCards } from "./QuickAccessCards";
import { RecentActivity } from "./RecentActivity";
import heroBg from "@/assets/hero-bg.jpg";

const statusSteps = [
  { 
    id: 1, 
    title: "Acionamentos recebidos", 
    description: "Solicitações da Energisa por email",
    icon: FileText,
    color: "bg-muted"
  },
  { 
    id: 2, 
    title: "Acionamentos executados", 
    description: "Serviços realizados conforme acionamento",
    icon: Wrench,
    color: "bg-primary"
  },
  { 
    id: 3, 
    title: "Medir os serviços", 
    description: "Planilha com medições e materiais",
    icon: TrendingUp,
    color: "bg-accent"
  },
  { 
    id: 4, 
    title: "Criar OS no sistema", 
    description: "Gera OS formal com evidências",
    icon: CheckCircle2,
    color: "bg-success"
  },
  { 
    id: 5, 
    title: "Enviar Book / Aguardando", 
    description: "Book com fotos e relatórios",
    icon: Clock,
    color: "bg-warning"
  },
  { 
    id: 6, 
    title: "Aprovação Fiscal", 
    description: "Energisa analisa e valida",
    icon: AlertCircle,
    color: "bg-primary"
  },
  { 
    id: 7, 
    title: "Obra criada (TCI)", 
    description: "Montar TCI e tratar pendências",
    icon: FileText,
    color: "bg-accent"
  },
  { 
    id: 8, 
    title: "Aprovação da medição", 
    description: "Gestor aprova a medição",
    icon: CheckCircle2,
    color: "bg-success"
  },
  { 
    id: 9, 
    title: "Geração de lote", 
    description: "Agrupa obras aprovadas",
    icon: FileText,
    color: "bg-primary"
  },
  { 
    id: 10, 
    title: "Emissão de NF", 
    description: "Nota fiscal para Concessionária",
    icon: CheckCircle2,
    color: "bg-success"
  }
];

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Background */}
      <div 
        className="relative bg-cover bg-center border-b border-border"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80"></div>
        <header className="relative">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">Sistema de Gestão de Obras</h1>
                <p className="text-lg opacity-90">Controle completo do fluxo de trabalho - Energisa MT</p>
              </div>
              <Badge variant="secondary" className="px-6 py-3 text-base font-semibold bg-white/20 text-white border-white/30">
                Dashboard
              </Badge>
            </div>
          </div>
        </header>
      </div>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Acionamentos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">24</div>
              <p className="text-xs text-muted-foreground mt-1">+4 desde ontem</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Obras em Andamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">18</div>
              <p className="text-xs text-muted-foreground mt-1">7 aguardando aprovação</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Medições Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">12</div>
              <p className="text-xs text-muted-foreground mt-1">3 urgentes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">NFs Emitidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">45</div>
              <p className="text-xs text-success-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Fluxo de Trabalho</CardTitle>
            <CardDescription>
              Acompanhe cada etapa do processo de gestão de obras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={step.id}
                    className="relative p-4 rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${step.color} p-2 rounded-lg text-white shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-muted-foreground">
                            {String(step.id).padStart(2, '0')}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border transform -translate-y-1/2"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Acesso Rápido</h2>
          <QuickAccessCards />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </main>
    </div>
  );
};
