import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, UserPlus, X } from "lucide-react";
import { InviteDialog } from "./InviteDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invite {
  id: string;
  email: string;
  roles: string[];
  status: string;
  criado_em: string;
  expira_em: string;
  admin_nome: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  accepted: "bg-green-500/10 text-green-500 border-green-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusNames: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  expired: "Expirado",
  cancelled: "Cancelado",
};

const roleNames: Record<string, string> = {
  ADMIN: "Admin",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

export const InvitesManagement = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select(`
          *,
          profiles!invites_convidado_por_fkey(nome)
        `)
        .order("criado_em", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((invite: any) => ({
        id: invite.id,
        email: invite.email,
        roles: invite.roles || [],
        status: invite.status,
        criado_em: invite.criado_em,
        expira_em: invite.expira_em,
        admin_nome: invite.profiles?.nome || "Admin",
      })) || [];

      setInvites(formattedData);
    } catch (error) {
      console.error("Error fetching invites:", error);
      toast({
        title: "Erro ao carregar convites",
        description: "Não foi possível carregar a lista de convites.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });

      fetchInvites();
    } catch (error) {
      console.error("Error cancelling invite:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o convite.",
        variant: "destructive",
      });
    }
  };

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Convites de Usuários
              </CardTitle>
              <CardDescription>
                Convide novos usuários para acessar o sistema
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Convite
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum convite enviado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{invite.email}</p>
                      <Badge
                        variant="outline"
                        className={statusColors[invite.status] || ""}
                      >
                        {statusNames[invite.status] || invite.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {invite.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {roleNames[role] || role}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Convidado por {invite.admin_nome} •{" "}
                      {format(new Date(invite.criado_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}{" "}
                      • Expira em{" "}
                      {format(new Date(invite.expira_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {invite.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchInvites}
      />
    </>
  );
};
