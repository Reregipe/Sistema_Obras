import { useEffect, useState } from "react";
// Supabase removido
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, FileText, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalAcionamentos: number;
  totalObras: number;
}

export const UsageStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAcionamentos: 0,
    totalObras: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dados mocados/local: ajuste conforme integração futura
  useEffect(() => {
    // Simula carregamento e popula com dados zerados ou mocados
    setTimeout(() => {
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalAcionamentos: 0,
        totalObras: 0,
      });
      setLoading(false);
    }, 500);
  }, []);

  const cards = [
    {
      title: "Total de Usuários",
      value: stats.totalUsers,
      icon: Users,
      description: "Usuários cadastrados",
      color: "text-blue-500",
    },
    {
      title: "Usuários Ativos",
      value: stats.activeUsers,
      icon: TrendingUp,
      description: "Com permissões ativas",
      color: "text-green-500",
    },
    {
      title: "Acionamentos",
      value: stats.totalAcionamentos,
      icon: Activity,
      description: "Total no sistema",
      color: "text-orange-500",
    },
    {
      title: "Obras",
      value: stats.totalObras,
      icon: FileText,
      description: "Total registradas",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : card.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
