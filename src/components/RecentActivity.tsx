import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2, FileText } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "acionamento",
    title: "Novo acionamento recebido",
    description: "AC-2025-0047 - Emergência LV em Cuiabá",
    time: "há 15 minutos",
    status: "urgent",
    icon: AlertCircle
  },
  {
    id: 2,
    type: "medicao",
    title: "Medição aprovada",
    description: "OS-2025-000123 - Troca de isolador",
    time: "há 1 hora",
    status: "success",
    icon: CheckCircle2
  },
  {
    id: 3,
    type: "obra",
    title: "OS criada no sistema",
    description: "OS-ENG-2025/045 enviada para Energisa",
    time: "há 2 horas",
    status: "info",
    icon: FileText
  },
  {
    id: 4,
    type: "pendente",
    title: "Aguardando aprovação",
    description: "TCI-2025-012 em análise fiscal",
    time: "há 3 horas",
    status: "pending",
    icon: Clock
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "urgent":
      return "bg-destructive/10 text-destructive";
    case "success":
      return "bg-success/10 text-success";
    case "info":
      return "bg-primary/10 text-primary";
    case "pending":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
        <CardDescription>Últimas movimentações no sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
