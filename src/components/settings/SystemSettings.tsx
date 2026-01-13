import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const requiredKeys = [
    "ups_valor_lm", "ups_valor_lv",
    "prazo_medir_servico_executado",
    "prazo_criar_os",
    "prazo_enviar_book",
    "prazo_abertura_obra_energisa",
    "prazo_aprovacao_fiscal",
    "prazo_apresentacao_tci",
    "prazo_aprovacao_medicao",
    "prazo_geracao_lote",
    "prazo_emissao_nf"
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("system_settings").select("*").order("chave");
      if (error) throw error;

      const list = data || [];
      const missing = requiredKeys
        .filter((key) => !list.find((s) => s.chave === key))
        .map((key) => ({
          id: crypto.randomUUID(),
          chave: key,
          valor: "",
          descricao:
            key === "ups_valor_lm"
              ? "Valor padrao da UPS - Linha Morta"
              : "Valor padrao da UPS - Linha Viva",
          tipo: "number",
        }));

      const merged = [...list, ...missing];
      setSettings(merged);

      const initialValues: Record<string, string> = {};
      merged.forEach((setting) => {
        initialValues[setting.chave] = setting.valor;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Erro ao carregar configuracoes",
        description: "Nao foi possivel carregar as configuracoes do sistema.",
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
      const changes = settings
        .filter((setting) => editedValues[setting.chave] !== setting.valor)
        .map((setting) => ({
          chave: setting.chave,
          valor: editedValues[setting.chave] ?? "",
          tipo: setting.tipo || "text",
          descricao: setting.descricao,
          atualizado_em: new Date().toISOString(),
        }));

      if (changes.length === 0) {
        toast({
          title: "Nenhuma alteracao",
          description: "Nao ha configuracoes para salvar.",
        });
        return;
      }

      const { error } = await supabase.from("system_settings").upsert(changes, {
        onConflict: "chave",
      });
      if (error) throw error;

      toast({
        title: "Configuracoes salvas",
        description: "As configuracoes do sistema foram atualizadas com sucesso.",
      });

      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Nao foi possivel salvar as configuracoes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: SystemSetting) => {
    const value = editedValues[setting.chave] ?? "";
    switch (setting.tipo) {
      case "boolean":
        return (
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => handleValueChange(setting.chave, checked ? "true" : "false")}
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
      ups_valor_lm: { label: "Valor padrao da UPS - Linha Morta", keyHint: "ups_valor_lm" },
      ups_valor_lv: { label: "Valor padrao da UPS - Linha Viva", keyHint: "ups_valor_lv" },
      upr_valor_padrao: { label: "Valor padrao da UPS (legado)", keyHint: "upr_valor_padrao (legado)" },
      prazo_medir_servico_executado: { label: "Prazo Medir Serviço Executado", keyHint: "prazo_medir_servico_executado" },
      prazo_criar_os: { label: "Prazo Criar OS", keyHint: "prazo_criar_os" },
      prazo_enviar_book: { label: "Prazo Enviar Book", keyHint: "prazo_enviar_book" },
      prazo_abertura_obra_energisa: { label: "Prazo padrão em dias para abertura de obra pela Energisa", keyHint: "prazo_abertura_obra_energisa" },
      prazo_aprovacao_fiscal: { label: "Prazo para aprovação fiscal", keyHint: "prazo_aprovacao_fiscal" },
      prazo_apresentacao_tci: { label: "Prazo de Apresentação do TCI", keyHint: "prazo_apresentacao_tci" },
      prazo_aprovacao_medicao: { label: "Prazo Aprovação da Medição", keyHint: "prazo_aprovacao_medicao" },
      prazo_geracao_lote: { label: "Prazo Geração de Lote", keyHint: "prazo_geracao_lote" },
      prazo_emissao_nf: { label: "Prazo Emissão de NF", keyHint: "prazo_emissao_nf" },
    };
    return map[setting.chave] || { label: setting.descricao || setting.chave, keyHint: setting.chave };
  };

  const hasSplitUps = settings.some((setting) => setting.chave === "ups_valor_lm" || setting.chave === "ups_valor_lv");
  const visibleSettings = hasSplitUps ? settings.filter((setting) => setting.chave !== "upr_valor_padrao") : settings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuracoes Gerais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {visibleSettings.map((setting) => (
            <div key={setting.id} className="flex flex-col space-y-2 p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor={setting.chave} className="text-sm font-medium">
                    {friendly(setting).label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Chave: {friendly(setting).keyHint}</p>
                </div>
                <div className="flex items-center gap-4">{renderInput(setting)}</div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Configuracoes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
