import { useState, useEffect } from "react";
// Supabase removido
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserRoleDialogProps {
  user: {
    id: string;
    nome: string;
    email: string;
    roles: Array<{ role: string }>;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const availableRoles = [
  { value: "ADMIN", label: "Administrador", description: "Acesso total ao sistema", sensitive: true },
  { value: "ADM", label: "Administrativo", description: "Cadastros e ajustes administrativos" },
  { value: "GESTOR", label: "Gestor", description: "Aprovações e gestão operacional" },
  { value: "OPER", label: "Operacional", description: "Operações diárias / campo" },
  { value: "FIN", label: "Financeiro", description: "Lotes, TCI e NF", sensitive: true },
];

export const UserRoleDialog = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserRoleDialogProps) => {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Initialize selected roles when dialog opens
    if (open) {
      const currentRoles = new Set(user.roles.map((r) => r.role));
      setSelectedRoles(currentRoles);
    }
  }, [open, user.roles]);

  const handleToggleRole = (role: string) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);
  };

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      toast({
        title: "Permissões atualizadas",
        description: `As permissões de ${user.nome} foram atualizadas (mock).`,
      });
      onSuccess();
      setSaving(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Defina as permissões para <strong>{user.nome}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableRoles.map((role) => (
            <div
              key={role.value}
              className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                id={role.value}
                checked={selectedRoles.has(role.value)}
                onCheckedChange={() => handleToggleRole(role.value)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={role.value}
                  className="text-sm font-medium cursor-pointer"
                >
                  {role.label}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {role.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
