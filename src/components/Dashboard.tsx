import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAccessCards } from "./QuickAccessCards";
import { RecentActivity } from "./RecentActivity";
import { WorkflowSteps } from "./WorkflowSteps";
import { MonitoringDashboard } from "./MonitoringDashboard";

export const DashboardContent = () => {
  return (
    <div className="container mx-auto px-6 py-8">
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
      <WorkflowSteps />

      {/* Monitoring Dashboard (após fluxo) */}
      <div className="mb-8">
        <MonitoringDashboard />
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Acesso Rápido</h2>
        <QuickAccessCards />
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};
