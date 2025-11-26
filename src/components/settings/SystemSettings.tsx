import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings } from "lucide-react";

interface SystemSetting {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  tipo: string;
}

export const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("chave");

      if (error) throw error;
      
      setSettings(data || []);
      
      // Initialize edited values
      const initialValues: Record<string, string> = {};
      data?.forEach((setting) => {
        initialValues[setting.chave] = setting.valor;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleValueChange = (chave: string, valor: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [chave]: valor,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each setting that changed
      const updates = settings
        .filter((setting) => editedValues[setting.chave] !== setting.valor)
        .map((setting) =>
          supabase
            .from("system_settings")
            .update({ 
              valor: editedValues[setting.chave],
              atualizado_em: new Date().toISOString()
            })
            .eq("chave", setting.chave)
        );

      if (updates.length === 0) {
        toast({
          title: "Nenhuma alteração",
          description: "Não há configurações para salvar.",
        });
        return;
      }

      await Promise.all(updates);

      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram atualizadas com sucesso.",
      });

      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: SystemSetting) => {
    const value = editedValues[setting.chave] || "";

    switch (setting.tipo) {
      case "boolean":
        return (
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) =>
              handleValueChange(setting.chave, checked ? "true" : "false")
            }
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.chave, e.target.value)}
            className="max-w-xs"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(setting.chave, e.target.value)}
            className="max-w-md"
          />
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const friendly = (setting: SystemSetting) => {
    const map: Record<string, { label: string; keyHint: string }> = {
      ups_valor_lm: { label: "Valor padrão da UPS - Linha Morta", keyHint: "ups_valor_lm" },
      ups_valor_lv: { label: "Valor padrão da UPS - Linha Viva", keyHint: "ups_valor_lv" },
      // Legado: exibir UPR como UPS enquanto a migration não for aplicada
      upr_valor_padrao: { label: "Valor padrão da UPS", keyHint: "upr_valor_padrao (legado)" },
    };
    return map[setting.chave] || { label: setting.descricao || setting.chave, keyHint: setting.chave };
  };

  const hasSplitUps = settings.some(
    (setting) => setting.chave === "ups_valor_lm" || setting.chave === "ups_valor_lv"
  );

  const visibleSettings = hasSplitUps
    ? settings.filter((setting) => setting.chave !== "upr_valor_padrao")
    : settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Gerais
        </CardTitle>
        <CardDescription>
          Defina os parâmetros padrão do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {visibleSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex flex-col space-y-2 p-4 border border-border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor={setting.chave} className="text-sm font-medium">
                    {friendly(setting).label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chave: {friendly(setting).keyHint}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {renderInput(setting)}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
