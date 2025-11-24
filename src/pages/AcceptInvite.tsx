import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { z } from "zod";

interface Invite {
  id: string;
  email: string;
  roles: string[];
  status: string;
  expira_em: string;
  convidado_por: string;
}

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número");

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      toast({
        title: "Link inválido",
        description: "O link de convite não é válido.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    fetchInvite(token);
  }, [searchParams]);

  const fetchInvite = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) {
        toast({
          title: "Convite não encontrado",
          description: "Este convite não existe ou já foi utilizado.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Verificar se o convite expirou
      if (new Date(data.expira_em) < new Date()) {
        toast({
          title: "Convite expirado",
          description: "Este convite já expirou. Solicite um novo convite.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Verificar se o convite já foi aceito
      if (data.status !== "pending") {
        toast({
          title: "Convite já utilizado",
          description: "Este convite já foi utilizado.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setInvite(data);
    } catch (error) {
      console.error("Error fetching invite:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o convite.",
        variant: "destructive",
      });
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invite) return;

    // Validar nome
    if (!nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    // Validar senha
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setPasswordError(passwordValidation.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setPasswordError("");

    try {
      // Criar conta
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: {
            nome: nome.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // Aguardar um pouco para o trigger criar o perfil
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Atribuir roles
      const roleInserts = invite.roles.map((role) => ({
        user_id: authData.user!.id,
        role: role as any,
        concedido_por: invite.convidado_por,
      }));

      const { error: rolesError } = await supabase.from("user_roles").insert(roleInserts);

      if (rolesError) {
        console.error("Error assigning roles:", rolesError);
        // Continuar mesmo com erro nas roles
      }

      // Marcar convite como aceito
      await supabase
        .from("invites")
        .update({ status: "accepted", aceito_em: new Date().toISOString() })
        .eq("id", invite.id);

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode acessar o sistema.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Você foi convidado para acessar o Sistema EngElétrica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={invite.email} disabled />
            </div>

            <div className="space-y-2">
              <Label>Suas Permissões</Label>
              <div className="flex flex-wrap gap-2">
                {invite.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {roleNames[role] || role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                required
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e
                números
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta e Aceitar Convite"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
