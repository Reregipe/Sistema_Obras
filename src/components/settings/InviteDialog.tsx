import { useState } from "react";
// Supabase removido
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const availableRoles = [
  { value: "ADMIN", label: "Administrador", description: "Acesso total ao sistema", preset: "Completo" },
  { value: "ADM", label: "Administrativo", description: "Cadastros e ajustes administrativos" },
  { value: "GESTOR", label: "Gestor", description: "Aprova medições/TCI e supervisiona" },
  { value: "OPER", label: "Operacional", description: "Operações diárias / campo" },
  { value: "FIN", label: "Financeiro", description: "Lotes, TCI e NF" },
];

const emailSchema = z.string().email("Email inválido");

export const InviteDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: InviteDialogProps) => {
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleToggleRole = (role: string) => {
    const newRoles = new Set(selectedRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setSelectedRoles(newRoles);
  };

  const applyPreset = (roles: string[]) => {
    setSelectedRoles(new Set(roles));
  };

  const handleSend = async () => {
    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRoles.size === 0) {
      toast({
        title: "Selecione permissões",
        description: "Selecione pelo menos uma permissão para o usuário.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setTimeout(() => {
      toast({
        title: "Convite enviado",
        description: `Um convite foi enviado para ${email} (mock).`,
      });
      setEmail("");
      setSelectedRoles(new Set());
      onSuccess();
      onOpenChange(false);
      setSending(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo usuário acessar o sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Presets rápidos:</span>
            <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(["GESTOR"])}>
              Gestor
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(["ADM"])}>
              Administrativo
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(["FIN"])}>
              Financeiro
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(["OPER"])}>
              Operacional
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => applyPreset(["ADMIN"])}>
              Administrador
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Permissões</Label>
            {availableRoles.map((role) => (
              <div
                key={role.value}
                className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`invite-${role.value}`}
                  checked={selectedRoles.has(role.value)}
                  onCheckedChange={() => handleToggleRole(role.value)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`invite-${role.value}`}
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
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Convite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
