import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AcionamentoForm } from "@/components/forms/AcionamentoForm";

const Acionamentos = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Acionamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar solicitações recebidas da Energisa
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Acionamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Acionamento</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo acionamento
              </DialogDescription>
            </DialogHeader>
            <AcionamentoForm 
              onSuccess={() => setOpen(false)} 
              onCancel={() => setOpen(false)} 
            />
          </DialogContent>
        </Dialog>
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
