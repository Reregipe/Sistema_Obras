import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield } from "lucide-react";
import { UserRoleDialog } from "./UserRoleDialog";

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  roles: Array<{ role: string }>;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  ADM: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  GESTOR: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  OPER: "bg-green-500/10 text-green-500 border-green-500/20",
  FIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

export const UsersManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .order("nome");

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        roles: rolesData?.filter((r) => r.user_id === profile.id) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRolesUpdated = () => {
    fetchUsers();
    handleCloseDialog();
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie permissões e funções dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    {user.roles.length > 0 ? (
                      user.roles.map((roleObj) => (
                        <Badge
                          key={roleObj.role}
                          variant="outline"
                          className={roleColors[roleObj.role] || ""}
                          title={roleNames[roleObj.role] || roleObj.role}
                        >
                          {roleNames[roleObj.role] || roleObj.role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="bg-muted/50">
                        Sem permissões
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(user)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gerenciar Permissões
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserRoleDialog
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleRolesUpdated}
        />
      )}
    </>
  );
};
