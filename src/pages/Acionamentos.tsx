import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Acionamentos = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acionamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar solicitações recebidas da Energisa
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Acionamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Acionamentos</CardTitle>
          <CardDescription>Todos os acionamentos cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum acionamento cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Acionamentos;
