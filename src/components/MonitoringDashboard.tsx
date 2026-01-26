import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
// Supabase removido
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface MonitoringMetrics {
  acionamentosAbertos: number;
  acionamentosUrgentes: number;
  obrasEnviadas: number;
  obrasAtrasadas: number;
  medicoesAguardandoGestor: number;
  tcisPendentes: number;
}

export const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState<MonitoringMetrics>({
    acionamentosAbertos: 0,
    acionamentosUrgentes: 0,
    obrasEnviadas: 0,
    obrasAtrasadas: 0,
    medicoesAguardandoGestor: 0,
    tcisPendentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const { runMonitoring } = useNotifications();

  useEffect(() => {
    // Dados mocados/local: ajuste conforme integração futura
    setLoading(true);
    setTimeout(() => {
      setMetrics({
        acionamentosAbertos: 0,
        acionamentosUrgentes: 0,
        obrasEnviadas: 0,
        obrasAtrasadas: 0,
        medicoesAguardandoGestor: 0,
        tcisPendentes: 0,
      });
      setLoading(false);
    }, 500);
    // Atualizar métricas a cada 5 minutos (mock)
    const interval = setInterval(() => {}, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // loadMetrics removido (dados mocados)

  const runMonitoringCheck = async () => {
    toast.info('Executando verificação de monitoramento...');
    await runMonitoring();
    await loadMetrics();
    toast.success('Verificação concluída!');
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value === 0) return "text-success";
    if (value >= threshold) return "text-destructive";
    return "text-warning";
  };

  const getStatusIcon = (value: number, threshold: number) => {
    if (value === 0) return <TrendingDown className="w-4 h-4 text-success" />;
    if (value >= threshold) return <AlertCircle className="w-4 h-4 text-destructive" />;
    return <Activity className="w-4 h-4 text-warning" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Monitoramento em Tempo Real</CardTitle>
            <CardDescription>
              Acompanhamento automático de alertas e pendências
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={runMonitoringCheck}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Acionamentos Urgentes */}
          <Card className="border-2 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Acionamentos Urgentes</span>
                {getStatusIcon(metrics.acionamentosUrgentes, 2)}
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(metrics.acionamentosUrgentes, 2)}`}>
                {metrics.acionamentosUrgentes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sem equipe atribuída
              </p>
              {metrics.acionamentosUrgentes > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Requer ação imediata
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Acionamentos Abertos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Acionamentos Abertos</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">
                {metrics.acionamentosAbertos}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total em processamento
              </p>
            </CardContent>
          </Card>

          {/* Obras Atrasadas */}
          <Card className="border-2 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Obras Atrasadas</span>
                {getStatusIcon(metrics.obrasAtrasadas, 2)}
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(metrics.obrasAtrasadas, 2)}`}>
                {metrics.obrasAtrasadas}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando Energisa &gt; 7 dias
              </p>
              {metrics.obrasAtrasadas > 0 && (
                <Badge className="mt-2 bg-warning text-warning-foreground">
                  Acompanhar de perto
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Obras Enviadas */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Obras Enviadas</span>
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">
                {metrics.obrasEnviadas}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando aprovação fiscal
              </p>
            </CardContent>
          </Card>

          {/* Medições Aguardando Gestor */}
          <Card className="border-2 border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Aprovação Gestor</span>
                {getStatusIcon(metrics.medicoesAguardandoGestor, 3)}
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(metrics.medicoesAguardandoGestor, 3)}`}>
                {metrics.medicoesAguardandoGestor}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Medições pendentes
              </p>
              {metrics.medicoesAguardandoGestor > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Aprovar urgente
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* TCIs Pendentes */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">TCIs Pendentes</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary">
                {metrics.tcisPendentes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aguardando criação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Summary */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Status Geral do Sistema</h4>
              <p className="text-sm text-muted-foreground">
                {metrics.acionamentosUrgentes + metrics.obrasAtrasadas + metrics.medicoesAguardandoGestor === 0
                  ? "✅ Todos os processos em dia"
                  : `⚠️ ${metrics.acionamentosUrgentes + metrics.obrasAtrasadas + metrics.medicoesAguardandoGestor} alertas ativos que requerem atenção`}
              </p>
            </div>
            <Badge 
              variant={metrics.acionamentosUrgentes + metrics.obrasAtrasadas + metrics.medicoesAguardandoGestor === 0 ? "default" : "destructive"}
              className="text-sm px-4 py-2"
            >
              {metrics.acionamentosUrgentes + metrics.obrasAtrasadas + metrics.medicoesAguardandoGestor === 0
                ? "Normal"
                : "Requer Ação"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
