import { useEffect, useState } from "react";
// Supabase removido
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
    setTimeout(() => {
      setSettings([]); // Lista vazia por padrão
      setEditedValues({});
      setLoading(false);
    }, 500);
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
    setTimeout(() => {
      toast({
        title: "Configuracoes salvas",
        description: "As configuracoes do sistema foram atualizadas (mock).",
      });
      setSaving(false);
    }, 500);
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
