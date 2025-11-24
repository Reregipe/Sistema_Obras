import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Materiais = () => {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materiais</h1>
          <p className="text-muted-foreground mt-1">
            Catálogo de materiais Energisa
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Materiais</CardTitle>
          <CardDescription>8 materiais cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Lista de materiais será exibida aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Materiais;
