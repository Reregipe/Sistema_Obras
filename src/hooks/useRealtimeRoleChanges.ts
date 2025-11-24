import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoleChangePayload {
  new: {
    id: string;
    user_id: string;
    role: string;
    acao: string;
    criado_em: string;
  };
}

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

export const useRealtimeRoleChanges = () => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("role-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_roles_history",
        },
        async (payload: RoleChangePayload) => {
          console.log("Role change detected:", payload);

          const { new: roleChange } = payload;

          // Buscar informações do usuário
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome, email")
            .eq("id", roleChange.user_id)
            .single();

          if (!profile) return;

          const roleName = roleNames[roleChange.role] || roleChange.role;
          const action = roleChange.acao === "concedido" ? "recebeu" : "perdeu";

          toast({
            title: "Permissão Alterada",
            description: `${profile.nome} ${action} a permissão ${roleName}`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
};
