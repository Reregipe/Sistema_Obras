import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface UserWithRoles {
  id: string;
  nome: string;
  email: string;
  roles: string[];
}

const roleNames: Record<string, string> = {
  ADMIN: "Admin",
  ADM: "Adm",
  GESTOR: "Gestor",
  OPER: "Oper",
  FIN: "Fin",
};

export const ActiveUsers = ({ detailed = false }: { detailed?: boolean }) => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .order("nome");

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = profiles
        ?.map((profile) => ({
          ...profile,
          roles: rolesData?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
        }))
        .filter((user) => user.roles.length > 0) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching active users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuários Ativos
        </CardTitle>
        <CardDescription>
          Usuários com permissões ativas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum usuário ativo encontrado
          </p>
        ) : (
          <div className="space-y-3">
            {users.slice(0, detailed ? undefined : 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(user.nome)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.nome}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="outline" className="text-xs">
                      {roleNames[role] || role}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {!detailed && users.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{users.length - 5} usuários
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
