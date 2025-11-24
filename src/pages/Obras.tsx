import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Obras = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Obras</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar obras e ordens de serviço
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Obra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Obras</CardTitle>
          <CardDescription>Todas as obras cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma obra cadastrada ainda.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Obras;
