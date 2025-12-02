import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAccessCards } from "./QuickAccessCards";
import { RecentActivity } from "./RecentActivity";
import { MonitoringDashboard } from "./MonitoringDashboard";

const kpis = [
  { title: "Receita prevista (mês)", value: "R$ 1,2 mi", sub: "Meta do mês" },
  { title: "Receita faturada (mês)", value: "R$ 840 mil", sub: "70% da meta" },
  { title: "SLA geral", value: "87%", sub: "Dentro do prazo" },
  { title: "Itens críticos", value: "9", sub: "Urgentes/atrasados" },
];

const funil = [
  { etapa: "Recebidos", valor: "24", detalhe: "5 urgentes" },
  { etapa: "Executando", valor: "38", detalhe: "12 em campo" },
  { etapa: "Medição", valor: "18", detalhe: "8 aguardando" },
  { etapa: "Lote", valor: "9", detalhe: "2 prontos" },
  { etapa: "NF", valor: "11", detalhe: "8 emitidas" },
];

const alertas = [
  "Urgente sem equipe há 4h (Cuiabá)",
  "Medição pendente lote 23 (R$ 210k)",
  "NF devolvida – lote 21 (ajustar book)",
  "Acionamento crítico sem viatura (VG)",
];

export const DashboardContent = () => {
  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* KPIs executivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funil resumido */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">Pipeline Operacional</CardTitle>
          <p className="text-sm text-muted-foreground">
            Quantidade de itens em cada etapa (acionamento → execução → medição → faturamento)
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {funil.map((step, idx) => (
            <div
              key={step.etapa}
              className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm flex flex-col gap-1"
            >
              <div className="text-sm text-muted-foreground">{step.etapa}</div>
              <div className="text-2xl font-semibold text-foreground">{step.valor}</div>
              <div className="text-xs text-muted-foreground">{step.detalhe}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alertas / Exceções */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">Alertas e Exceções</CardTitle>
          <p className="text-sm text-muted-foreground">Itens que precisam de ação imediata</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {alertas.map((a) => (
            <div key={a} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {a}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monitoramento (gráficos/indicadores) */}
      <div>
        <MonitoringDashboard />
      </div>

      {/* Acesso rápido + Atividades recentes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Acesso Rápido</h2>
          <QuickAccessCards />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
};
