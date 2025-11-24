import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Configuracoes = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configurações gerais do sistema
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>Ajuste as configurações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Configurações em desenvolvimento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;
