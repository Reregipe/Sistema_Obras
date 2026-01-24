import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCodigosMO } from "@/services/api";
import { upsertCodigoMO } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

type CodigoMO = {
  codigo_mao_de_obra: string;
  descricao: string | null;
  unidade: string | null;
  operacao: string | null;
  ups: number | null;
  tipo: string | null;
  ativo: string | null;
};

export default function CodigosMO() {
  const { toast } = useToast();
  const [lista, setLista] = useState<CodigoMO[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    codigo: "",
    descricao: "",
    unidade: "",
    operacao: "",
    ups: "",
    tipo: "",
    ativo: true,
  });

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await getCodigosMO();
      setLista(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const filtrados = useMemo(() => {
    const term = busca.toLowerCase();
    return lista.filter(
      (item) =>
        item.codigo_mao_de_obra.toLowerCase().includes(term) ||
        (item.descricao || "").toLowerCase().includes(term)
    );
  }, [busca, lista]);

  const salvar = async () => {
    try {
      if (!form.codigo.trim() || !form.operacao.trim()) {
        throw new Error("Código e Operação são obrigatórios.");
      }
      if (!form.tipo.trim()) {
        throw new Error("Selecione o tipo (LM ou LV).");
      }
      setIsSaving(true);
      const payload = {
        codigo_mao_de_obra: form.codigo.trim().toUpperCase(),
        descricao: form.descricao.trim() || null,
        unidade: form.unidade.trim() || null,
        operacao: form.operacao.trim().toUpperCase(),
        ups: form.ups.trim() === "" ? null : Number(form.ups.replace(",", ".")),
        tipo: form.tipo.trim().toUpperCase(),
        ativo: form.ativo ? "S" : "N",
      };
      await upsertCodigoMO(payload);
      toast({ title: "Salvo com sucesso" });
      setOpen(false);
      carregar();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-foreground">Códigos de Mão de Obra</h1>
        <Button variant="destructive" onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo código
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Catálogo de Códigos MO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Descrição</th>
                  <th className="px-3 py-2 text-left">Unidade</th>
                  <th className="px-3 py-2 text-left">Operação</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">UPS</th>
                  <th className="px-3 py-2 text-center">Ativo</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhum código encontrado
                    </td>
                  </tr>
                ) : (
                  filtrados.map((item) => (
                    <tr key={`${item.codigo_mao_de_obra}-${item.operacao}-${item.tipo}`} className="border-t">
                      <td className="px-3 py-2 font-semibold">{item.codigo_mao_de_obra}</td>
                      <td className="px-3 py-2">{item.descricao}</td>
                      <td className="px-3 py-2">{item.unidade}</td>
                      <td className="px-3 py-2">{item.operacao}</td>
                      <td className="px-3 py-2">{item.tipo}</td>
                      <td className="px-3 py-2 text-right">{item.ups ?? ""}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={item.ativo === "N" ? "text-red-500" : "text-emerald-600"}>
                          {item.ativo === "N" ? "Inativo" : "Ativo"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            Total: {lista.length} código{lista.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo código de MO</DialogTitle>
            <DialogDescription>Preencha os dados para adicionar um novo código.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ex: 6598"
                />
              </div>
              <div>
                <Label>Operação</Label>
                <Input
                  value={form.operacao}
                  onChange={(e) => setForm({ ...form, operacao: e.target.value })}
                  placeholder="Ex: 07.15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unidade</Label>
                <Input
                  value={form.unidade}
                  onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  placeholder="Ex: UN"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="LM">LM</option>
                  <option value="LV">LV</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição do serviço"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>UPS</Label>
                <Input
                  value={form.ups}
                  onChange={(e) => setForm({ ...form, ups: e.target.value })}
                  placeholder="Ex: 10.50"
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                />
                <Label>Ativo?</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={isSaving}>
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </div>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
