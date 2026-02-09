import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNome, setSignupNome] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !user.user_metadata?.must_change_password) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message,
      });
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Senha muito curta',
        description: 'A senha deve ter no minimo 6 caracteres.',
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await signUp(signupEmail, signupPassword, signupNome);

    if (error) {
      const message = (error.message || '').toLowerCase();
      if (message.includes('already') && message.includes('registered')) {
        toast({
          variant: 'destructive',
          title: 'Email ja cadastrado',
          description: 'Use o login ou recupere a senha para acessar.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar conta',
          description: error.message,
        });
      }
      setIsLoading(false);
      return;
    }

    if (!data?.user) {
      toast({
        variant: 'destructive',
        title: 'Email ja cadastrado',
        description: 'Use o login ou recupere a senha para acessar.',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: 'Voce ja pode fazer login.',
    });
    setLoginEmail(signupEmail);
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!loginEmail) {
      toast({
        variant: 'destructive',
        title: 'Informe seu email',
        description: 'Preencha o email para enviar o link de redefinicao.',
      });
      return;
    }

    setIsResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar link',
        description: error.message,
      });
    } else {
      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    }
    setIsResetting(false);
  };

  const renderForceChangePassword = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Definir nova senha</CardTitle>
        <CardDescription>Por seguranca, defina uma nova senha para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword.length < 6) {
              toast({
                variant: 'destructive',
                title: 'Senha muito curta',
                description: 'A senha deve ter no minimo 6 caracteres.',
              });
              return;
            }
            if (newPassword !== confirmNewPassword) {
              toast({
                variant: 'destructive',
                title: 'Senhas diferentes',
                description: 'Confirme a mesma senha nos dois campos.',
              });
              return;
            }

            setIsUpdatingPassword(true);
            const { error } = await supabase.auth.updateUser({
              password: newPassword,
              data: { must_change_password: false },
            });
            setIsUpdatingPassword(false);

            if (error) {
              toast({
                variant: 'destructive',
                title: 'Erro ao atualizar senha',
                description: error.message,
              });
              return;
            }

            toast({
              title: 'Senha atualizada',
              description: 'Agora voce ja pode acessar o sistema.',
            });
            navigate('/');
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isUpdatingPassword}>
            {isUpdatingPassword ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar nova senha'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderLoginAndSignup = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sistema de Gestao de Obras</CardTitle>
        <CardDescription>Faca login ou crie sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                  >
                    {isResetting ? 'Enviando...' : 'Esqueci a senha'}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-nome">Nome Completo</Label>
                <Input
                  id="signup-nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={signupNome}
                  onChange={(e) => setSignupNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                    aria-label={showSignupPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Minimo de 6 caracteres</p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-center text-sm text-muted-foreground">
        <p className="w-full">
          Ao continuar, voce concorda com nossos Termos de Servico e Politica de Privacidade.
        </p>
      </CardFooter>
    </Card>
  );

  const mustChangePassword = user?.user_metadata?.must_change_password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      {user && mustChangePassword ? renderForceChangePassword() : renderLoginAndSignup()}
    </div>
  );
};

export default Auth;
