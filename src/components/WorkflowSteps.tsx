import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp, ArrowRight, Loader2, Plus, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  route: string;
  count: number;
  urgent?: number;
  delayed?: number;
  status: "pending" | "active" | "completed" | "alert";
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Acionamentos recebidos",
    description: "Recebido e lista previa de materiais para o almox",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: "/acionamentos",
    count: 0,
    status: "alert",
  },
  {
    id: 2,
    title: "Acionamentos executados",
    description: "Servico em execucao ou despachado",
    icon: Wrench,
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: "/acionamentos",
    count: 0,
    status: "active",
  },
  {
    id: 3,
    title: "Medir servicos executados",
    description: "Valorizar MO, ajustar materiais e registrar horario (orcamento)",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    route: "/medicoes",
    count: 0,
    status: "alert",
  },
  {
    id: 4,
    title: "Criar OS no sistema",
    description: "OS formal com dados e evidencias",
    icon: CheckCircle2,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: "/obras",
    count: 0,
    status: "active",
  },
  {
    id: 5,
    title: "Enviar Book / Aguardando Obra",
    description: "Book com fotos e relatorios",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    route: "/obras",
    count: 0,
    status: "pending",
  },
  {
    id: 6,
    title: "Aprovacao Fiscal",
    description: "Analise de evidencias e conformidade",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    route: "/obras",
    count: 0,
    status: "alert",
  },
  {
    id: 7,
    title: "Obra criada (TCI)",
    description: "TCI emitido e pendencias tratadas",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    route: "/obras",
    count: 0,
    status: "active",
  },
  {
    id: 8,
    title: "Aprovacao da medicao",
    description: "Gestor aprova para pagamento",
    icon: CheckCircle2,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    route: "/medicoes",
    count: 0,
    status: "alert",
  },
  {
    id: 9,
    title: "Geracao de lote",
    description: "Agrupa obras aprovadas",
    icon: FileText,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    route: "/medicoes",
    count: 0,
    status: "pending",
  },
  {
    id: 10,
    title: "Emissao de NF",
    description: "Nota fiscal para concessionaria",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    route: "/medicoes",
    count: 0,
    status: "completed",
  },
];

export const WorkflowSteps = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>(workflowSteps);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [preLista, setPreLista] = useState<any[]>([]);
  const [preCodigo, setPreCodigo] = useState("");
  const [preQtd, setPreQtd] = useState<number>(1);
  const [preSugestoes, setPreSugestoes] = useState<any[]>([]);
  const [preMatEncontrado, setPreMatEncontrado] = useState<any | null>(null);
  const [consumo, setConsumo] = useState<any[]>([]);
  const [sucata, setSucata] = useState<any[]>([]);
  const [savingPre, setSavingPre] = useState(false);
  const [savingConsumo, setSavingConsumo] = useState(false);
  const [savingSucata, setSavingSucata] = useState(false);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [materialInfo, setMaterialInfo] = useState<string | null>(null);
  const [loadingSugestoesPre, setLoadingSugestoesPre] = useState(false);
  const [sucataCodigo, setSucataCodigo] = useState("");
  const [sucataQtd, setSucataQtd] = useState<number>(1);
  const [sucataSugestoes, setSucataSugestoes] = useState<any[]>([]);
  const [sucataMatEncontrado, setSucataMatEncontrado] = useState<any | null>(null);
  const [loadingSugestoesSucata, setLoadingSugestoesSucata] = useState(false);
  const [consumoCodigo, setConsumoCodigo] = useState("");
  const [consumoMatEncontrado, setConsumoMatEncontrado] = useState<any | null>(null);
  const [consumoQtd, setConsumoQtd] = useState<number>(1);

  useEffect(() => {
    if (open && selectedStep) {
      loadItems(selectedStep);
    }
  }, [open, selectedStep]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const updated = await Promise.all(
          steps.map(async (step) => {
            const { count, error } = await supabase
              .from("acionamentos")
              .select("id_acionamento", { count: "exact", head: true })
              .eq("etapa_atual", step.id);
            if (error) throw error;
            return { ...step, count: count || 0 };
          })
        );
        setSteps(updated);
      } catch (err) {
        console.error("Erro ao contar etapas", err);
      }
    };
    fetchCounts();
  }, []);

  const loadItems = async (step: WorkflowStep) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("acionamentos")
        .select(
          "id_acionamento,codigo_acionamento,numero_os,status,prioridade,municipio,modalidade,data_abertura,etapa_atual"
        )
        .eq("etapa_atual", step.id)
        .order("data_abertura", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar itens da etapa.");
    } finally {
      setLoading(false);
    }
  };

  const searchMaterial = async (term: string) => {
    const t = term.trim();
    if (!t) return [];
    const { data } = await supabase
      .from("materiais")
      .select("*")
      .or(`codigo_material.ilike.%${t}%,descricao.ilike.%${t}%`)
      .order("descricao")
      .limit(8);
    return data || [];
  };

  const openMaterialsModal = async (item: any) => {
    setMaterialsOpen(true);
    setMaterialsLoading(true);
    setMaterialError(null);
    setMaterialInfo(null);
    setPreLista([]);
    setConsumo([]);
    setSucata([]);
    try {
      const { data: pre } = await supabase
        .from("pre_lista_itens")
        .select("id,codigo_material,quantidade_prevista,criado_em")
        .eq("id_acionamento", item.id_acionamento)
        .order("criado_em", { ascending: false });
      setPreLista(pre || []);

      if (selectedStep?.id && selectedStep.id > 1) {
        const { data: consumoList } = await supabase
          .from("lista_aplicacao_itens")
          .select("id_lista_aplicacao_item,codigo_material,descricao_item,unidade_medida,quantidade,id_acionamento")
          .eq("id_acionamento", item.id_acionamento)
          .order("ordem_item");
        setConsumo(
          (consumoList || []).map((c) => ({
            id: c.id_lista_aplicacao_item,
            codigo_material: c.codigo_material,
            descricao_item: c.descricao_item || "",
            unidade_medida: c.unidade_medida || "",
            quantidade: Number(c.quantidade || 0),
          }))
        );

        const { data: sucataList } = await supabase
          .from("sucata_itens")
          .select("id,codigo_material,quantidade_retirada,criado_em")
          .eq("id_acionamento", item.id_acionamento)
          .order("criado_em", { ascending: false });
        setSucata(
          (sucataList || []).map((s) => ({
            id: s.id,
            codigo_material: s.codigo_material,
            quantidade: Number(s.quantidade_retirada || 0),
          }))
        );
      }
    } catch (err: any) {
      setMaterialError(err.message || "Erro ao carregar listas.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleAddPreItem = () => {
    if (!preMatEncontrado) {
      setMaterialError("Busque um material valido antes de adicionar.");
      return;
    }
    if (!preQtd || preQtd <= 0) {
      setMaterialError("Informe quantidade maior que zero.");
      return;
    }
    setMaterialError(null);
    setMaterialInfo(null);
    const exists = preLista.find((p) => p.codigo_material === preMatEncontrado.codigo_material);
    if (exists) {
      setPreLista((prev) =>
        prev.map((p) =>
          p.codigo_material === preMatEncontrado.codigo_material
            ? { ...p, quantidade_prevista: Number(p.quantidade_prevista || 0) + preQtd }
            : p
        )
      );
    } else {
      setPreLista((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          codigo_material: preMatEncontrado.codigo_material,
          quantidade_prevista: preQtd,
        },
      ]);
    }
    setPreMatEncontrado(null);
    setPreCodigo("");
    setPreQtd(1);
    setPreSugestoes([]);
  };

  const buscarPreMaterial = async () => {
    const data = await searchMaterial(preCodigo);
    if (!data || data.length === 0) {
      setMaterialError("Material não encontrado para pré-lista.");
      setPreMatEncontrado(null);
    } else {
      setMaterialError(null);
      setPreMatEncontrado(data[0]);
    }
  };

  const buscarSucataMaterial = async () => {
    const data = await searchMaterial(sucataCodigo);
    if (!data || data.length === 0) {
      setMaterialError("Material não encontrado para sucata.");
      setSucataMatEncontrado(null);
    } else {
      setMaterialError(null);
      setSucataMatEncontrado(data[0]);
    }
  };

  const buscarConsumoMaterial = async () => {
    const data = await searchMaterial(consumoCodigo);
    if (!data || data.length === 0) {
      setMaterialError("Material não encontrado para consumo.");
      setConsumoMatEncontrado(null);
    } else {
      setMaterialError(null);
      setConsumoMatEncontrado(data[0]);
    }
  };

  const handleRemovePreItem = (codigo: string) => {
    setPreLista((prev) => prev.filter((p) => p.codigo_material !== codigo));
  };

  const savePreLista = async () => {
    if (!selectedItem) return;
    setSavingPre(true);
    setMaterialError(null);
    setMaterialInfo(null);
    try {
      const payload = preLista.map((p) => ({
        id_acionamento: selectedItem.id_acionamento,
        codigo_material: p.codigo_material,
        quantidade_prevista: p.quantidade_prevista,
      }));
      await supabase.from("pre_lista_itens").delete().eq("id_acionamento", selectedItem.id_acionamento);
      if (payload.length > 0) {
        const { error } = await supabase.from("pre_lista_itens").insert(payload);
        if (error) throw error;
      }
      setMaterialInfo("Pré-lista salva.");
    } catch (err: any) {
      setMaterialError(err.message || "Erro ao salvar pré-lista.");
    } finally {
      setSavingPre(false);
    }
  };

  const handleAddConsumoItem = () => {
    if (!consumoMatEncontrado) {
      setMaterialError("Selecione um material para consumo.");
      return;
    }
    if (!consumoQtd || consumoQtd < 0) {
      setMaterialError("Informe quantidade válida para consumo.");
      return;
    }
    setMaterialError(null);
    setConsumo((prev) =>
      prev.some((i) => i.codigo_material === consumoMatEncontrado.codigo_material)
        ? prev.map((i) =>
            i.codigo_material === consumoMatEncontrado.codigo_material
              ? { ...i, quantidade: i.quantidade + consumoQtd }
              : i
          )
        : [
            ...prev,
            {
              codigo_material: consumoMatEncontrado.codigo_material,
              descricao_item: consumoMatEncontrado.descricao || "",
              unidade_medida: consumoMatEncontrado.unidade_medida || "",
              quantidade: consumoQtd,
            },
          ]
    );
    setConsumoCodigo("");
    setConsumoMatEncontrado(null);
    setConsumoQtd(1);
  };

  const handleRemoveConsumo = (codigo: string) => {
    setConsumo((prev) => prev.filter((c) => c.codigo_material !== codigo));
  };

  const handleUpdateConsumoQuantidade = (codigo: string, valor: number) => {
    setConsumo((prev) =>
      prev.map((c) =>
        c.codigo_material === codigo ? { ...c, quantidade: valor >= 0 ? valor : 0 } : c
      )
    );
  };

  const handleUpdateSucataQuantidade = (codigo: string, valor: number) => {
    setSucata((prev) =>
      prev.map((c) =>
        c.codigo_material === codigo ? { ...c, quantidade: valor >= 0 ? valor : 0 } : c
      )
    );
  };

  const saveConsumo = async () => {
    if (!selectedItem) return;
    setSavingConsumo(true);
    setMaterialError(null);
    setMaterialInfo(null);
    try {
      await supabase.from("lista_aplicacao_itens").delete().eq("id_acionamento", selectedItem.id_acionamento);
      if (consumo.length > 0) {
        const payload = consumo.map((c, idx) => ({
          id_acionamento: selectedItem.id_acionamento,
          codigo_material: c.codigo_material,
          descricao_item: c.descricao_item || "",
          unidade_medida: c.unidade_medida || "",
          quantidade: c.quantidade,
          ordem_item: idx + 1,
          valor_unitario_upr: 0,
          valor_total: 0,
        }));
        const { error } = await supabase.from("lista_aplicacao_itens").insert(payload);
        if (error) throw error;
      }
      setMaterialInfo("Consumo salvo.");
    } catch (err: any) {
      setMaterialError(err.message || "Erro ao salvar consumo.");
    } finally {
      setSavingConsumo(false);
    }
  };

  const saveSucata = async () => {
    if (!selectedItem) return;
    setSavingSucata(true);
    setMaterialError(null);
    setMaterialInfo(null);
    try {
      await supabase.from("sucata_itens").delete().eq("id_acionamento", selectedItem.id_acionamento);
      if (sucata.length > 0) {
        const payload = sucata.map((s) => ({
          id_acionamento: selectedItem.id_acionamento,
          codigo_material: s.codigo_material,
          quantidade_retirada: s.quantidade,
        }));
        const { error } = await supabase.from("sucata_itens").insert(payload);
        if (error) throw error;
      }
      setMaterialInfo("Sucata salva.");
    } catch (err: any) {
      setMaterialError(err.message || "Erro ao salvar sucata.");
    } finally {
      setSavingSucata(false);
    }
  };

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setOpen(true);
  };

  const getStatusBadge = (step: WorkflowStep) => {
    const statusMap: Record<WorkflowStep["status"], string> = {
      pending: "bg-muted text-muted-foreground",
      active: "bg-primary/10 text-primary border border-primary/20",
      completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      alert: "bg-destructive/10 text-destructive border border-destructive/20",
    };
    return (
      <Badge variant="outline" className={cn("text-xs", statusMap[step.status])}>
        {step.status === "completed" ? "Concluído" : step.status === "active" ? "Em andamento" : step.status === "alert" ? "Alerta" : "Pendente"}
      </Badge>
    );
  };

  const renderItems = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando itens...
        </div>
      );
    }
    if (error) {
      return <div className="text-sm text-destructive">{error}</div>;
    }
    if (items.length === 0) {
      return <div className="text-sm text-muted-foreground">Nenhum item nesta etapa.</div>;
    }

    return items.map((item) => (
      <div
        key={item.id_acionamento}
        className="border border-border rounded-lg p-3 space-y-2 bg-card text-foreground"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="cursor-pointer" onClick={() => navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`)}>
            <div className="font-semibold text-foreground">
              {item.codigo_acionamento || item.id_acionamento}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.municipio || "--"} • {item.modalidade || "--"}
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {item.status || "--"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedItem(item);
              openMaterialsModal(item);
            }}
          >
            Lista de materiais
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`);
              setOpen(false);
            }}
          >
            Editar acionamento
          </Button>
        </div>
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Fluxo de Trabalho - Controle de Etapas</CardTitle>
            <CardDescription className="mt-2">
              Acompanhe cada etapa e nao deixe nada para tras. Clique em uma etapa para ver os detalhes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Urgente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-warning rounded-full"></div>
              <span className="text-xs text-muted-foreground">Atrasado</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const hasAlert = step.urgent || step.delayed;

            return (
              <div key={step.id} className="relative group">
                <Card
                  className={cn(
                    "transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1",
                    hasAlert && "border-2 border-destructive"
                  )}
                  onClick={() => handleStepClick(step)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className={cn("p-2 rounded-lg", step.bgColor)}>
                          <Icon className={cn("w-5 h-5", step.color)} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-2xl font-bold text-foreground">{step.count}</div>
                          {getStatusBadge(step)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-muted-foreground mb-1">
                          ETAPA {String(step.id).padStart(2, "0")}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                          {step.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{step.description}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground mt-auto"
                      >
                        Ver detalhes
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border transform -translate-y-1/2 z-10"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">3</div>
                <div className="text-xs text-muted-foreground">Itens Urgentes</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">5</div>
                <div className="text-xs text-muted-foreground">Itens Atrasados</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">60</div>
                <div className="text-xs text-muted-foreground">Total em Andamento</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedStep?.title || "Etapa"}</DialogTitle>
            <DialogDescription>Itens associados a esta etapa do fluxo de trabalho.</DialogDescription>
          </DialogHeader>
          {selectedStep?.id === 1 && (
            <div className="mb-4 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 p-3 text-sm text-muted-foreground">
              Lembrete: ao receber o acionamento, monte a lista de material previa para o almoxarifado disponibilizar a equipe.
            </div>
          )}
          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-3">{renderItems()}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen}>
        <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista de Materiais {selectedStep?.id === 1 ? "(Pré-lista)" : "(Execução)"}</DialogTitle>
            <DialogDescription>{selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--"}</DialogDescription>
          </DialogHeader>

          {materialError && <div className="text-sm text-destructive">{materialError}</div>}
          {materialInfo && <div className="text-sm text-emerald-600">{materialInfo}</div>}

          {materialsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando listas...
            </div>
          ) : selectedStep?.id === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-3">
                  <Label>Codigo do material</Label>
                  <Input value={preCodigo} onChange={(e) => setPreCodigo(e.target.value)} placeholder="Ex.: MAT-001" />
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={preQtd}
                    onChange={(e) => setPreQtd(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={buscarPreMaterial}>
                    Buscar
                  </Button>
                  <Button onClick={handleAddPreItem} disabled={!preMatEncontrado}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                </div>
              </div>
              {preMatEncontrado && (
                <p className="text-xs text-muted-foreground">
                  {preMatEncontrado.codigo_material} - {preMatEncontrado.descricao} ({preMatEncontrado.unidade_medida})
                </p>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Pré-lista</h4>
                {preLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item na pré-lista.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preLista.map((p) => (
                        <TableRow key={p.codigo_material}>
                          <TableCell>{p.codigo_material}</TableCell>
                          <TableCell>{p.quantidade_prevista}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRemovePreItem(p.codigo_material)}>
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={savePreLista} disabled={savingPre}>
                  {savingPre ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar pré-lista
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-2">Pré-lista (referência)</h4>
                {preLista.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma pré-lista encontrada.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Qtd prevista</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preLista.map((p) => (
                        <TableRow key={p.codigo_material}>
                          <TableCell>{p.codigo_material}</TableCell>
                          <TableCell>{p.quantidade_prevista}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Materiais utilizados (consumo real)</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-3">
                    <Label>Codigo do material</Label>
                    <Input
                      value={consumoCodigo}
                      onChange={(e) => setConsumoCodigo(e.target.value)}
                      placeholder="Ex.: MAT-001"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={consumoQtd}
                      onChange={(e) => setConsumoQtd(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="outline" onClick={buscarConsumoMaterial}>
                      Buscar
                    </Button>
                    <Button onClick={handleAddConsumoItem} disabled={!consumoMatEncontrado}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                  </div>
                </div>
                {consumoMatEncontrado && (
                  <p className="text-xs text-muted-foreground">
                    {consumoMatEncontrado.codigo_material} - {consumoMatEncontrado.descricao} ({consumoMatEncontrado.unidade_medida})
                  </p>
                )}
                {consumo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item de consumo.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumo.map((c) => (
                        <TableRow key={c.codigo_material}>
                          <TableCell>{c.codigo_material}</TableCell>
                          <TableCell>{c.descricao_item}</TableCell>
                          <TableCell>{c.unidade_medida}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={c.quantidade}
                              onChange={(e) => handleUpdateConsumoQuantidade(c.codigo_material, Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveConsumo(c.codigo_material)}>
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="flex justify-end">
                  <Button onClick={saveConsumo} disabled={savingConsumo}>
                    {savingConsumo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar consumo
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Materiais retirados (sucata)</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-3">
                    <Label>Codigo do material</Label>
                    <Input
                      value={sucataCodigo}
                      onChange={(e) => setSucataCodigo(e.target.value)}
                      placeholder="Ex.: MAT-001"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={sucataQtd}
                      onChange={(e) => setSucataQtd(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button variant="outline" onClick={buscarSucataMaterial}>
                      Buscar
                    </Button>
                    <Button variant="destructive" onClick={handleAddSucataItem} disabled={!sucataMatEncontrado}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar sucata
                    </Button>
                  </div>
                </div>
                {sucataMatEncontrado && (
                  <p className="text-xs text-muted-foreground">
                    {sucataMatEncontrado.codigo_material} - {sucataMatEncontrado.descricao} ({sucataMatEncontrado.unidade_medida})
                  </p>
                )}
                {sucata.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item de sucata.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sucata.map((s) => (
                        <TableRow key={s.codigo_material}>
                          <TableCell>{s.codigo_material}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={s.quantidade}
                              onChange={(e) => handleUpdateSucataQuantidade(s.codigo_material, Number(e.target.value))}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveSucata(s.codigo_material)}>
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="flex justify-end">
                  <Button variant="destructive" onClick={saveSucata} disabled={savingSucata}>
                    {savingSucata ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar sucata
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
