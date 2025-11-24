import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Workflow } from "lucide-react";

interface StatusCount {
  name: string;
  value: number;
  color: string;
}

export const WorkflowStats = ({ detailed = false }: { detailed?: boolean }) => {
  const [acionamentosData, setAcionamentosData] = useState<StatusCount[]>([]);
  const [obrasData, setObrasData] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflowStats();
  }, []);

  const fetchWorkflowStats = async () => {
    try {
      // Buscar status dos acionamentos
      const { data: acionamentos } = await supabase
        .from("acionamentos")
        .select("status");

      const acionamentosCount: Record<string, number> = {};
      acionamentos?.forEach((a) => {
        acionamentosCount[a.status] = (acionamentosCount[a.status] || 0) + 1;
      });

      const acionamentosChartData: StatusCount[] = Object.entries(acionamentosCount).map(
        ([status, count], index) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: `hsl(${index * 60}, 70%, 50%)`,
        })
      );

      // Buscar status das obras
      const { data: obras } = await supabase.from("obras").select("os_status");

      const obrasCount: Record<string, number> = {};
      obras?.forEach((o) => {
        obrasCount[o.os_status] = (obrasCount[o.os_status] || 0) + 1;
      });

      const obrasChartData: StatusCount[] = Object.entries(obrasCount).map(
        ([status, count], index) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: `hsl(${index * 50 + 180}, 70%, 50%)`,
        })
      );

      setAcionamentosData(acionamentosChartData);
      setObrasData(obrasChartData);
    } catch (error) {
      console.error("Error fetching workflow stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Status dos Acionamentos
          </CardTitle>
          <CardDescription>Distribuição por status</CardDescription>
        </CardHeader>
        <CardContent>
          {acionamentosData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={acionamentosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {acionamentosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Status das Obras
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {obrasData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={obrasData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {obrasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};
