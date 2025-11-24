import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export const DashboardCharts = () => {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [prioridadeData, setPrioridadeData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    // Status de acionamentos
    const { data: acionamentos } = await supabase
      .from('acionamentos')
      .select('status');

    if (acionamentos) {
      const statusCount = acionamentos.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      setStatusData(
        Object.entries(statusCount).map(([name, value]) => ({ name, value }))
      );
    }

    // Prioridade de acionamentos
    const { data: prioridades } = await supabase
      .from('acionamentos')
      .select('prioridade');

    if (prioridades) {
      const prioridadeCount = prioridades.reduce((acc: any, item) => {
        acc[item.prioridade] = (acc[item.prioridade] || 0) + 1;
        return acc;
      }, {});

      setPrioridadeData(
        Object.entries(prioridadeCount).map(([name, value]) => ({ name, value }))
      );
    }

    // Timeline de obras (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: obras } = await supabase
      .from('obras')
      .select('criado_em')
      .gte('criado_em', sevenDaysAgo.toISOString());

    if (obras) {
      const timeline = obras.reduce((acc: any, item) => {
        const date = new Date(item.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      setTimelineData(
        Object.entries(timeline).map(([date, count]) => ({ date, count }))
      );
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  const chartConfig = {
    value: {
      label: "Quantidade",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Status dos Acionamentos</CardTitle>
          <CardDescription>Distribuição por status</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={60}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prioridades</CardTitle>
          <CardDescription>Acionamentos por prioridade</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prioridadeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução (7 dias)</CardTitle>
          <CardDescription>Obras criadas nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
