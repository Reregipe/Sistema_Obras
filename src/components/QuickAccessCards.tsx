import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Truck, 
  Package, 
  Wrench, 
  Plus, 
  ArrowRight,
  Settings
} from "lucide-react";

const quickActions = [
  {
    title: "Materiais",
    description: "Catálogo de materiais Energisa",
    icon: Package,
    color: "text-primary",
    bgColor: "bg-primary/10",
    action: "Gerenciar Materiais"
  },
  {
    title: "Equipes",
    description: "Equipes de campo cadastradas",
    icon: Users,
    color: "text-success",
    bgColor: "bg-success/10",
    action: "Ver Equipes"
  },
  {
    title: "Códigos MO",
    description: "Códigos de mão de obra padrão",
    icon: Wrench,
    color: "text-accent",
    bgColor: "bg-accent/10",
    action: "Ver Códigos"
  },
  {
    title: "Viaturas",
    description: "Veículos disponíveis",
    icon: Truck,
    color: "text-warning",
    bgColor: "bg-warning/10",
    action: "Gerenciar Viaturas"
  }
];

export const QuickAccessCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickActions.map((item) => {
        const Icon = item.icon;
        return (
          <Card 
            key={item.title}
            className="hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`${item.bgColor} p-3 rounded-lg ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <Settings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full justify-between group-hover:bg-secondary"
              >
                {item.action}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
