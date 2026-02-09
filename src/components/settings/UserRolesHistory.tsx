import { useState, useEffect } from "react";
// Supabase removido
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, UserPlus, UserMinus, Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
// import removido: useRealtimeRoleChanges

interface HistoryEntry {
  id: string;
  user_id: string;
  role: string;
  acao: string;
  concedido_por: string | null;
  criado_em: string;
  user_nome: string;
  user_email: string;
  admin_nome: string | null;
}

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

export const UserRolesHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Hook para escutar mudanças em tempo real
  // useRealtimeRoleChanges removido

  const fetchHistory = async () => {
    setLoading(true);
    setTimeout(() => {
      setHistory([]); // Lista vazia por padrão
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Permissões
            </CardTitle>
            <CardDescription>
              Auditoria completa de mudanças de permissões (últimas 50 ações)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF(history)}
              disabled={history.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(history)}
              disabled={history.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma alteração de permissão registrada.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="mt-1">
                  {entry.acao === "concedido" ? (
                    <UserPlus className="h-5 w-5 text-green-500" />
                  ) : (
                    <UserMinus className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {entry.user_nome}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({entry.user_email})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {entry.acao === "concedido" ? "recebeu" : "perdeu"} a permissão
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {roleNames[entry.role] || entry.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.admin_nome && (
                      <span>por {entry.admin_nome} • </span>
                    )}
                    {format(new Date(entry.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
