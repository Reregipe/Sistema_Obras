import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";

const Viaturas = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Viaturas</h1>
          <p className="text-muted-foreground mt-1">
            Informacoes de viaturas agora estao consolidadas nos cartoes das equipes
          </p>
        </div>
        <Button className="gap-2" variant="outline" asChild>
          <a href="/equipes">
            <ArrowLeft className="h-4 w-4" />
            Ir para Equipes
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Viaturas</CardTitle>
          <CardDescription>Conferir equipe, modelo, ano e placa direto na tela de Equipes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              <Users className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Viaturas estao na ficha da equipe</p>
              <p className="text-muted-foreground max-w-md">
                Cada cartao de equipe exibe veiculo, ano, placa e celular. Use a tela de Equipes para imprimir ou consultar.
              </p>
            </div>
            <Button asChild>
              <a href="/equipes">Abrir Equipes</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Viaturas;
