import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity } from "lucide-react";

interface ActionData {
  date: string;
  acionamentos: number;
  obras: number;
  notificacoes: number;
  roleChanges: number;
}

export const ActionsByPeriod = () => {
  const [data, setData] = useState<ActionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30">("7");

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), days));

      // Buscar acionamentos por dia
      const { data: acionamentosData } = await supabase
        .from("acionamentos")
        .select("criado_em")
        .gte("criado_em", startDate.toISOString());

      // Buscar obras por dia
      const { data: obrasData } = await supabase
        .from("obras")
        .select("criado_em")
        .gte("criado_em", startDate.toISOString());

      // Buscar notificações por dia
      const { data: notificacoesData } = await supabase
        .from("notificacoes")
        .select("criado_em")
        .gte("criado_em", startDate.toISOString());

      // Buscar mudanças de roles por dia
      const { data: roleChangesData } = await supabase
        .from("user_roles_history")
        .select("criado_em")
        .gte("criado_em", startDate.toISOString());

      // Processar dados por dia
      const dailyData: Record<string, ActionData> = {};

      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - i - 1), "yyyy-MM-dd");
        dailyData[date] = {
          date: format(subDays(new Date(), days - i - 1), "dd/MM", { locale: ptBR }),
          acionamentos: 0,
          obras: 0,
          notificacoes: 0,
          roleChanges: 0,
        };
      }

      // Contar acionamentos
      acionamentosData?.forEach((item) => {
        const date = format(new Date(item.criado_em), "yyyy-MM-dd");
        if (dailyData[date]) dailyData[date].acionamentos++;
      });

      // Contar obras
      obrasData?.forEach((item) => {
        const date = format(new Date(item.criado_em), "yyyy-MM-dd");
        if (dailyData[date]) dailyData[date].obras++;
      });

      // Contar notificações
      notificacoesData?.forEach((item) => {
        const date = format(new Date(item.criado_em), "yyyy-MM-dd");
        if (dailyData[date]) dailyData[date].notificacoes++;
      });

      // Contar mudanças de roles
      roleChangesData?.forEach((item) => {
        const date = format(new Date(item.criado_em), "yyyy-MM-dd");
        if (dailyData[date]) dailyData[date].roleChanges++;
      });

      setData(Object.values(dailyData));
    } catch (error) {
      console.error("Error fetching actions data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Ações por Período
            </CardTitle>
            <CardDescription>Atividades registradas no sistema</CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "7" | "30")}>
            <TabsList>
              <TabsTrigger value="7">7 dias</TabsTrigger>
              <TabsTrigger value="30">30 dias</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="acionamentos"
                stroke="#f97316"
                name="Acionamentos"
              />
              <Line type="monotone" dataKey="obras" stroke="#8b5cf6" name="Obras" />
              <Line
                type="monotone"
                dataKey="notificacoes"
                stroke="#3b82f6"
                name="Notificações"
              />
              <Line
                type="monotone"
                dataKey="roleChanges"
                stroke="#10b981"
                name="Mudanças de Permissão"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
