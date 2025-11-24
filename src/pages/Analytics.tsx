import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageStats } from "@/components/analytics/UsageStats";
import { ActiveUsers } from "@/components/analytics/ActiveUsers";
import { ActionsByPeriod } from "@/components/analytics/ActionsByPeriod";
import { WorkflowStats } from "@/components/analytics/WorkflowStats";
import { BarChart3 } from "lucide-react";

const Analytics = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Analytics e Estatísticas
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize o desempenho e uso do sistema em tempo real
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <UsageStats />
          <div className="grid gap-6 md:grid-cols-2">
            <ActiveUsers />
            <WorkflowStats />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <ActiveUsers detailed />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <ActionsByPeriod />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <WorkflowStats detailed />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
