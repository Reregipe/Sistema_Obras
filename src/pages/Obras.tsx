// import { maoDeObraCatalog } from "@/data/maoDeObraCatalog";
import { useEffect, useState, useRef, useMemo } from "react";
import { getCodigosMO, getSystemSettings } from "@/services/api";
// Adicione a dependência xlsx no seu projeto: npm install xlsx
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { WorkflowStepsObras } from "@/components/domain/WorkflowStepsObras";
import { useNavigate } from "react-router-dom";
import { equipesCatalog } from "@/data/equipesCatalog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const parseDecimal = (value) => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Obras = () => {
  const { toast } = useToast();
                      // Estado para tipo de mão de obra (linha viva/morta)
  const [tipoMOEnv, setTipoMOEnv] = useState('');
  // Estado para inclusão rápida de mão de obra no modal de consolidação
  const [novoMOEnv, setNovoMOEnv] = useState({ codigo: '', descricao: '', unidade: '', ups: '', quantidadeInstalada: 1 });
  // Estado para opções de autocomplete vindas do banco
  const [opcoesMO, setOpcoesMO] = useState<any[]>([]);
  const [loadingMO, setLoadingMO] = useState(false);
  const [tipoMORecebida, setTipoMORecebida] = useState('');
  const [novoMORecebida, setNovoMORecebida] = useState({ codigo: '', descricao: '', unidade: '', ups: '', quantidadeInstalada: 1 });
  const [maoDeObraRecebida, setMaoDeObraRecebida] = useState<any[]>([]);
  const [upsConfigs, setUpsConfigs] = useState({ lm: 0, lv: 0 });
  const [medicoesParciais, setMedicoesParciais] = useState({
    "OBRA-MEDICAO": [
      {
        dataMedicao: "14/01/2026",
        valorMedido: "12345.67",
        numeroLote: "L-001",
        dataLote: "14/01/2026",
        numeroNotaFiscal: "NF-9876",
        dataNotaFiscal: "14/01/2026",
        observacoes: "Medição parcial",
      },
    ],
  });
  const [novaMedicaoParcial, setNovaMedicaoParcial] = useState({
    dataMedicao: "",
    valorMedido: "",
    numeroLote: "",
    dataLote: "",
    numeroNotaFiscal: "",
    dataNotaFiscal: "",
    observacoes: "",
  });
  const [modalObraMedicaoOpen, setModalObraMedicaoOpen] = useState(false);
  const [modalMedicoesOpen, setModalMedicoesOpen] = useState(false);
  const [modalMedicaoParcialOpen, setModalMedicaoParcialOpen] = useState(false);
  const [maoDeObraEnviadaSalva, setMaoDeObraEnviadaSalva] = useState<any[]>([]);

  // Busca dinâmica dos códigos de mão de obra do banco local
  useEffect(() => {
    if (!tipoMOEnv && !novoMOEnv.descricao.trim()) {
      setOpcoesMO([]);
      return;
    }
    const handler = setTimeout(async () => {
      setLoadingMO(true);
      let codigos = await getCodigosMO({ ativo: true, tipo: tipoMOEnv, descricao: novoMOEnv.descricao.trim() });
      setOpcoesMO(codigos);
      setLoadingMO(false);
    }, 350);
    return () => clearTimeout(handler);
  }, [tipoMOEnv, novoMOEnv.descricao]);

  const resolverMaoDeObra = async (texto: string, fallbackTipo: string) => {
    const inicial = {
      codigo: '',
      descricao: texto,
      unidade: '',
      tipo: fallbackTipo,
      ups: '',
    };
    const trimmed = texto.trim();
    if (!trimmed) return inicial;
    const parts = trimmed.split("-");
    const codigoLookup = parts[0]?.trim();
    let matchOption: any = null;
    if (codigoLookup) {
      matchOption = opcoesMO.find((mo) => mo.codigo_mao_de_obra === codigoLookup);
    }
    if (!matchOption) {
      const normalizado = trimmed.toLowerCase();
      matchOption = opcoesMO.find((mo) => {
        const pair = `${mo.codigo_mao_de_obra} - ${mo.descricao}`.toLowerCase();
        return (
          pair === normalizado ||
          mo.codigo_mao_de_obra.toLowerCase() === normalizado ||
          mo.descricao?.toLowerCase() === normalizado
        );
      });
    }
    if (!matchOption && codigoLookup) {
      const fetched = await getCodigosMO({ codigo_mao_de_obra: codigoLookup });
      matchOption = fetched?.[0] || null;
    }
    if (matchOption) {
      return {
        codigo: matchOption.codigo_mao_de_obra,
        descricao: matchOption.descricao || texto,
        unidade: matchOption.unidade || inicial.unidade,
        tipo: matchOption.tipo || inicial.tipo,
        ups: matchOption.ups ?? inicial.ups,
      };
    }
    const fallbackMatch = /^([^\s-]+)\s*-\s*(.+)$/.exec(trimmed);
    if (fallbackMatch) {
      const codigo = fallbackMatch[1];
      const descricao = fallbackMatch[2];
      const fallback = opcoesMO.find((mo) => mo.codigo_mao_de_obra === codigo);
      return {
        codigo,
        descricao,
        unidade: fallback?.unidade || inicial.unidade,
        tipo: fallback?.tipo || inicial.tipo,
        ups: fallback?.ups ?? inicial.ups,
      };
    }
    const fallback = opcoesMO.find((mo) => mo.codigo_mao_de_obra === trimmed);
    return {
      ...inicial,
      codigo: fallback?.codigo_mao_de_obra || inicial.codigo,
      descricao: fallback?.descricao || inicial.descricao,
      unidade: fallback?.unidade || inicial.unidade,
      tipo: fallback?.tipo || inicial.tipo,
      ups: fallback?.ups ?? inicial.ups,
    };
  };

  const handleAdicionarEnv = async () => {
    if (!obraMedicaoSelecionada) return;
    const resolved = await resolverMaoDeObra(novoMOEnv.descricao, tipoMOEnv);
    const novoItem = {
      ...resolved,
      quantidadeInstalada: novoMOEnv.quantidadeInstalada,
      quantidadeTotal: novoMOEnv.quantidadeInstalada,
    };
    const novaLista = [...(obraMedicaoSelecionada.maoDeObraUtilizada || []), novoItem];
    setObraMedicaoSelecionada({
      ...obraMedicaoSelecionada,
      maoDeObraUtilizada: novaLista,
    });
    setMaoDeObraEnviadaSalva(novaLista);
    setNovoMOEnv({ codigo: '', descricao: '', unidade: '', ups: '', quantidadeInstalada: 1 });
  };

  const handleAdicionarRecebida = async () => {
    const resolved = await resolverMaoDeObra(novoMORecebida.descricao, tipoMORecebida);
    const novoItem = {
      ...resolved,
      quantidadeInstalada: novoMORecebida.quantidadeInstalada,
      quantidadeTotal: novoMORecebida.quantidadeInstalada,
    };
    setMaoDeObraRecebida((prev) => [...prev, novoItem]);
    setNovoMORecebida({ codigo: '', descricao: '', unidade: '', ups: '', quantidadeInstalada: 1 });
  };

  useEffect(() => {
    const loadUpsConfigs = async () => {
      const data = await getSystemSettings(["ups_valor_lm", "ups_valor_lv"]);
      const next = { lm: 0, lv: 0 };
      data.forEach((entry) => {
        if (entry.chave === "ups_valor_lm") next.lm = parseDecimal(entry.valor);
        if (entry.chave === "ups_valor_lv") next.lv = parseDecimal(entry.valor);
      });
      setUpsConfigs(next);
    };
    loadUpsConfigs();
  }, []);
                  // Exemplo de dados de mão de obra consolidada
                  const maoDeObraConsolidada = [
                    { codigo: "MO-001", descricao: "Eletricista", quantidade: 3, valorUnitario: 250, valorTotal: 750 },
                    { codigo: "MO-002", descricao: "Auxiliar", quantidade: 2, valorUnitario: 180, valorTotal: 360 },
                    { codigo: "MO-003", descricao: "Encarregado", quantidade: 1, valorUnitario: 350, valorTotal: 350 },
                  ];
                // Estado para obra selecionada no modal de medições
  const [obraMedicaoSelecionada, setObraMedicaoSelecionada] = useState(null);

  const calcularValoresMo = (mo) => {
    const item = opcoesMO.find(
      (opt) =>
        opt.codigo_mao_de_obra === mo.codigo &&
        opt.descricao?.toLowerCase() === mo.descricao?.toLowerCase()
    );
    const tipoRaw = (mo.tipo || item?.tipo || "").toString().toUpperCase();
    const tipo = tipoRaw || "";
    const unidade = mo.unidade || item?.unidade || "-";
    const upsFraction = parseDecimal(mo.ups ?? item?.ups ?? 0);
    const quantidade = parseDecimal(mo.quantidadeTotal ?? mo.quantidadeInstalada ?? 0);
    const valorConfiguracao =
      (tipo === "LV" ? upsConfigs.lv : upsConfigs.lm) || 0;
    const valorUnitarioConfigurado = upsFraction * valorConfiguracao;
    const valorTotal = valorUnitarioConfigurado * quantidade;
    return {
      tipo,
      unidade,
      quantidade,
      valorUnitarioFracao: upsFraction,
      valorUnitarioConfigurado,
      valorTotal,
    };
  };

  // Mão de obra utilizada: busca da obra selecionada, se existir
  const maoDeObraUtilizada = obraMedicaoSelecionada?.maoDeObraUtilizada || [];
  const totalValorMaoDeObra = maoDeObraUtilizada.reduce(
    (acc, mo) => acc + calcularValoresMo(mo).valorTotal,
    0
  );
  const totalValorMaoDeObraRecebida = maoDeObraRecebida.reduce(
    (acc, mo) => acc + calcularValoresMo(mo).valorTotal,
    0
  );
  const totalMedicoesParciais =
    obraMedicaoSelecionada
      ? (medicoesParciais[obraMedicaoSelecionada.obra] || []).reduce(
          (acc, mediacao) => acc + parseDecimal(mediacao.valorMedido),
          0
        )
      : 0;
  const valorFinalRecebido = totalValorMaoDeObraRecebida;
  const valorFaltante = totalValorMaoDeObraRecebida - totalMedicoesParciais;
  const [medicoesSalvas, setMedicoesSalvas] = useState(null);
  const [salvoRecentemente, setSalvoRecentemente] = useState(false);

  const handleSalvarMedicoes = async () => {
    if (!obraMedicaoSelecionada) {
      toast({
        title: "Selecione uma obra",
        description: "Abra uma obra com medições para salvar os dados.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      obra: obraMedicaoSelecionada.obra,
      mediçõesParciais: medicoesParciais[obraMedicaoSelecionada.obra] || [],
      maoDeObraEnviada: maoDeObraEnviadaSalva,
      maoDeObraRecebida: maoDeObraRecebida,
      totalEnviada: maoDeObraEnviadaSalva.reduce((acc, mo) => acc + calcularValoresMo(mo).valorTotal, 0),
      totalMedicoesParciais,
      totalRecebida: totalValorMaoDeObraRecebida,
      totalConsolidado: valorFinalRecebido,
      valorFaltante,
      savedAt: new Date().toISOString(),
    };
    setMedicoesSalvas(payload);
    setSalvoRecentemente(true);
    toast({
      title: "Medições salvas",
      description: "Todas as entradas do modal foram gravadas com sucesso.",
      variant: "default",
      className: "bg-emerald-500 text-white shadow-lg",
    });
  };
      const [obraExecucaoSelecionada, setObraExecucaoSelecionada] = useState(null);
      const [modalExecucaoDetalheOpen, setModalExecucaoDetalheOpen] = useState(false);
    const [execucaoModalOpen, setExecucaoModalOpen] = useState(false);
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [planejamentoModalOpen, setPlanejamentoModalOpen] = useState(false);
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [detalheObraModalOpen, setDetalheObraModalOpen] = useState(false);

  const [obras, setObras] = useState([
    {
      obra: "OBRA-PLANEJAMENTO",
      os: "OS-PL-1001",
      status: "planejamento",
      tci: "pendente",
      gestor: "",
      cidade: "Cuiaba",
      inicio: "",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
    {
      obra: "OBRA-EXECUCAO",
      os: "OS-EX-1002",
      status: "execucao",
      tci: "pendente",
      gestor: "aguardando",
      cidade: "Varzea Grande",
      inicio: "10/01/2026",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
    {
      obra: "OBRA-MEDICAO",
      os: "OS-ME-1003",
      status: "medicao",
      tci: "emitido",
      gestor: "aguardando",
      cidade: "Primavera",
      inicio: "05/01/2026",
      encerradas: "sim",
      dataPrevisaoTermino: "",
      dataTerminoObra: "12/01/2026"
    },
    {
      obra: "OBRA-TCI",
      os: "OS-TCI-1004",
      status: "tci",
      tci: "pendente",
      gestor: "pendente",
      cidade: "Cuiaba",
      inicio: "28/12/2025",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
    {
      obra: "OBRA-APROVACAO",
      os: "OS-AP-1005",
      status: "aprovacao",
      tci: "validado",
      gestor: "aprovado",
      cidade: "Primavera",
      inicio: "20/12/2025",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
    {
      obra: "OBRA-FATURAMENTO",
      os: "OS-FA-1006",
      status: "faturar",
      tci: "validado",
      gestor: "aprovado",
      cidade: "Cuiaba",
      inicio: "15/12/2025",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
  ]);

  // Filtra obras sem marco inicial (data de início vazia, null, undefined ou só espaços)
  const obrasSemMarcoInicial = useMemo(
    () => obras.filter((obra) => !obra.inicio || String(obra.inicio).trim() === ""),
    [obras]
  );
    // Função para lidar com importação de Excel
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        // Aqui você pode tratar os dados importados (json)
        console.log("Obras importadas:", json);
        // Exemplo: setObras(json as any[]);
      };
      reader.readAsArrayBuffer(file);
    };
  const [novaObra, setNovaObra] = useState({
    prioridade: "",
    projetoSiagoOdi: "",
    mesCarteira: "",
    os: "",
    municipio: "",
    bairro: "",
    endereco: "",
    descricaoObra: "",
    solicitante: "",
    contato: "",
      valorPrevisto: "",
      });

  const handleChange = (e) => {
    setNovaObra({ ...novaObra, [e.target.name]: e.target.value });
  };

  const handleSalvarObra = () => {
    // Adiciona nova obra sem data de início (etapa planejamento)
    setObras([
      ...obras,
      {
        ...novaObra,
        inicio: "", // Garante que nova obra entra no planejamento
        status: "planejamento",
        tci: "pendente",
        gestor: "",
        cidade: novaObra.municipio || "",
        obra: novaObra.projetoSiagoOdi || "",
        encerradas: "",
        dataPrevisaoTermino: "",
        dataTerminoObra: ""
      },
    ]);
    setModalOpen(false);
    setNovaObra({
      prioridade: "",
      projetoSiagoOdi: "",
      mesCarteira: "",
      os: "",
      municipio: "",
      bairro: "",
      endereco: "",
      descricaoObra: "",
      solicitante: "",
      contato: "",
      valorPrevisto: ""
    });
  };

  const kpis = useMemo(
    () => [
      { label: "Planejamento", value: "4" },
      { label: "Execução", value: "7" },
      { label: "TCI pendente", value: "2" },
      { label: "Prontas p/ NF", value: "3" },
    ],
    [],
  );

  const etapas = useMemo(
    () => [
      { title: "Planejamento", desc: "Escopo, cronograma e orçamento", status: "em andamento" },
      { title: "Execução", desc: "Equipe em campo, medições parciais", status: "7 obras" },
      { title: "Medições", desc: "Consolidar MO/material", status: "3 pendentes" },
      { title: "TCI / Tratativas", desc: "Ajustes e pendências", status: "2 TCI pendentes" },
      { title: "Aprovação", desc: "Gestor/Fiscal", status: "4 aguardando" },
      { title: "Faturamento", desc: "Lote / NF", status: "3 prontas" },
    ],
    [],
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Obras (longo prazo)</h1>
          <p className="text-muted-foreground">
            Acompanhe obras planejadas da concepção ao faturamento. Sempre por número da obra (Energisa) e OS interna.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Modal Planejamento permanece acessível apenas pela régua de etapas */}
          <Dialog open={planejamentoModalOpen} onOpenChange={setPlanejamentoModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Planejamento</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Obras sem marco inicial</p>
              </DialogHeader>
                    {obrasSemMarcoInicial.length === 0 ? (
                      <div className="py-4 text-muted-foreground">Todas as obras sem marco inicial.</div>
                    ) : (
                      <>
                        <div className="grid gap-3 md:grid-cols-2">
                          {obrasSemMarcoInicial.map((item) => (
                            <Card
                              key={item.obra}
                              className="border shadow-sm cursor-pointer"
                              onClick={() => {
                                setObraSelecionada(item);
                                setDetalheObraModalOpen(true);
                              }}
                            >
                              <CardHeader className="py-4 flex items-center justify-center">
                                <CardTitle className="text-lg font-bold text-center">{item.obra || "Sem número"}</CardTitle>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>

                        {/* Modal de detalhes da obra selecionada */}
                        <Dialog open={detalheObraModalOpen} onOpenChange={setDetalheObraModalOpen}>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detalhes da obra: {obraSelecionada?.obra}</DialogTitle>
                            </DialogHeader>
                            {obraSelecionada && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Início Físico da Obra</label>
                                  <input
                                    type="date"
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                    value={obraSelecionada.inicioFisicoObra || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, inicioFisicoObra: e.target.value })}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Tipo de Equipe</label>
                                  <select
                                    value={obraSelecionada.tipoEquipe || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, tipoEquipe: e.target.value })}
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                  >
                                    <option value="">Selecione</option>
                                    <option value="LM">LM</option>
                                    <option value="LV">LV</option>
                                    <option value="LM+LV">LM+LV</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Equipes</label>
                                  <Select
                                    value={obraSelecionada?.equipes?.[0] || ""}
                                    onValueChange={value => {
                                      // Alterna seleção: se já está, remove; se não, adiciona
                                      let novasEquipes = Array.isArray(obraSelecionada?.equipes) ? [...obraSelecionada.equipes] : [];
                                      if (novasEquipes.includes(value)) {
                                        novasEquipes = novasEquipes.filter(eq => eq !== value);
                                      } else {
                                        novasEquipes.push(value);
                                      }
                                      setObraSelecionada({ ...obraSelecionada, equipes: novasEquipes });
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma ou mais equipes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {equipesCatalog
                                        .filter(eq => {
                                          if (!obraSelecionada?.tipoEquipe) return true;
                                          if (obraSelecionada.tipoEquipe === 'LM+LV') return true;
                                          if (obraSelecionada.tipoEquipe === 'LM') return eq.linha !== 'viva';
                                          if (obraSelecionada.tipoEquipe === 'LV') return eq.linha === 'viva';
                                          return true;
                                        })
                                        .map(eq => (
                                          <SelectItem key={eq.code} value={eq.code}>
                                            {eq.code} - {eq.encarregado}
                                            {obraSelecionada?.equipes?.includes(eq.code) ? " (selecionada)" : ""}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  <span className="text-xs text-muted-foreground mt-1">Clique novamente para remover uma equipe já selecionada.</span>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {obraSelecionada?.equipes?.map(code => {
                                      const eq = equipesCatalog.find(e => e.code === code);
                                      return eq ? (
                                        <span key={code} className="px-2 py-1 bg-accent rounded text-xs">
                                          {eq.code} - {eq.encarregado}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-sm font-medium">Previsão de Término</label>
                                  <input
                                    type="date"
                                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                                    value={obraSelecionada.dataPrevisaoTermino || ''}
                                    onChange={e => setObraSelecionada({ ...obraSelecionada, dataPrevisaoTermino: e.target.value })}
                                  />
                                </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDetalheObraModalOpen(false)}>Cancelar</Button>
                                <Button
                                  onClick={() => {
                                    if (!obraSelecionada) return;
                                    setObras(prevObras => prevObras.map(o => {
                                      if (o.obra === obraSelecionada.obra) {
                                        // Só move para execução se estava em planejamento e agora tem início físico
                                        const vaiParaExecucao = o.status === "planejamento" && obraSelecionada.inicioFisicoObra;
                                        return {
                                          ...o,
                                          ...obraSelecionada,
                                          status: vaiParaExecucao ? "execucao" : o.status,
                                          inicio: obraSelecionada.inicioFisicoObra || o.inicio,
                                        };
                                      }
                                      return o;
                                    }));
                                    setDetalheObraModalOpen(false);
                                  }}
                                >Salvar</Button>
                              </DialogFooter>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                            {/* Mini-formulário para obra selecionada */}

            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
            <Download className="h-4 w-4" />
            Importar Excel
          </Button>
          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            style={{ display: "none" }}
          />
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Obra
          </Button>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Obra</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Prioridade</label>
                      <select
                        name="prioridade"
                        value={novaObra.prioridade}
                        onChange={handleChange}
                        className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                      >
                        <option value="">Selecione</option>
                        <option value="urgente">Urgente</option>
                        <option value="alta">Alta</option>
                        <option value="media">Média</option>
                        <option value="baixa">Baixa</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Número da Obra</label>
                      <Input name="projetoSiagoOdi" value={novaObra.projetoSiagoOdi} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Mês da Carteira</label>
                      <Input name="mesCarteira" value={novaObra.mesCarteira} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">OS</label>
                      <Input name="os" value={novaObra.os} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Município</label>
                      <Input name="municipio" value={novaObra.municipio} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Bairro</label>
                      <Input name="bairro" value={novaObra.bairro} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-sm font-medium">Endereço</label>
                      <Input name="endereco" value={novaObra.endereco} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-sm font-medium">Descrição da Obra</label>
                      <Input name="descricaoObra" value={novaObra.descricaoObra} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Solicitante</label>
                      <Input name="solicitante" value={novaObra.solicitante} onChange={handleChange} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Contato</label>
                      <Input name="contato" value={novaObra.contato} onChange={handleChange} />
                    </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Valor Previsto (R$)</label>
                        <Input name="valorPrevisto" type="number" value={novaObra.valorPrevisto} onChange={handleChange} />
                      </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSalvarObra}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{item.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Régua de etapas (Obras longo prazo)</CardTitle>
          <CardDescription>Visual rápido do progresso. Clique para detalhar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {etapas.map((etapa) => {
            let clickHandler = undefined;
            if (etapa.title === "Planejamento") clickHandler = () => setPlanejamentoModalOpen(true);
            if (etapa.title === "Execução") clickHandler = () => setExecucaoModalOpen(true);
            if (etapa.title === "Medições") clickHandler = () => setModalMedicoesOpen(true);
            if (etapa.title === "TCI / Tratativas") clickHandler = () => {/* TODO: handler TCI */};
            if (etapa.title === "Aprovação") clickHandler = () => {/* TODO: handler Aprovação */};
            if (etapa.title === "Faturamento") clickHandler = () => {/* TODO: handler Faturamento */};
            return (
              <div
                key={etapa.title}
                className="rounded-lg border p-4 hover:border-primary transition-colors cursor-pointer"
                onClick={clickHandler}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-foreground">{etapa.title}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{etapa.desc}</p>
                <div className="mt-2">
                  <Badge variant="secondary">{etapa.status}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
        {/* Modal exclusivo para Medições - fora do modal de execução */}
        <Dialog open={modalMedicoesOpen} onOpenChange={setModalMedicoesOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Medições - Consolidação MO/Material</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Consolide as medições de mão de obra e materiais das obras encerradas.</p>
            </DialogHeader>
            <div className="grid gap-3">
              {obras.filter(o => o.status === "medicao" && o.encerradas === "sim").length === 0 ? (
                <div className="py-4 text-muted-foreground">Nenhuma obra encerrada disponível para consolidação.</div>
              ) : (
                obras.filter(o => o.status === "medicao" && o.encerradas === "sim").map((obra) => (
                  <Card key={obra.obra} className="border shadow-sm cursor-pointer" onClick={() => { setObraMedicaoSelecionada(obra); setModalObraMedicaoOpen(true); }}>
                    <CardHeader className="py-2">
                      <CardTitle className="text-base font-bold">{obra.obra}</CardTitle>
                      <CardDescription>OS: {obra.os} | Cidade: {obra.cidade}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>Status: <Badge variant="secondary">{obra.status}</Badge></div>
                      <div>Início: {obra.inicio || "-"}</div>
                      <div>Encerradas: {obra.encerradas === "sim" ? "Sim" : "Não"}</div>
                      <div className="mt-2 text-xs text-primary">Clique para consolidar/visualizar detalhes</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalMedicoesOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de detalhes/consolidação da obra selecionada no modal de medições */}
        <Dialog open={modalObraMedicaoOpen} onOpenChange={setModalObraMedicaoOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Consolidação de Medições - {obraMedicaoSelecionada?.obra}</DialogTitle>
            </DialogHeader>
            {obraMedicaoSelecionada && (
              <div className="space-y-2">
                <div className="p-4 border rounded-lg bg-white shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo negociado</p>
                  <p className="text-2xl font-bold text-foreground">R$ {valorFinalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <div className="text-sm text-muted-foreground space-y-0.5 mt-2">
                    <p>Valor recebido (negociado): R$ {totalValorMaoDeObraRecebida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p>Medições parciais lançadas: R$ {totalMedicoesParciais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p>Valor faltante: R$ {valorFaltante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <p>Mão de obra enviada: R$ {totalValorMaoDeObra.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  </div>
                  {salvoRecentemente && (
                    <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold self-start">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Informações salvas
                    </div>
                  )}
                </div>
                  <div className="mt-8 p-2 border rounded-lg bg-muted">
                  <h4 className="text-base font-bold mb-2">Medições Parciais</h4>
                  <div className="overflow-x-auto">
                    {(obraMedicaoSelecionada && medicoesParciais[obraMedicaoSelecionada.obra]?.length > 0) ? (
                      <table className="min-w-full border text-xs">
                        <thead>
                          <tr className="bg-muted">
                            <th className="px-2 py-1 border">Data</th>
                            <th className="px-2 py-1 border">Valor Medido (R$)</th>
                            <th className="px-2 py-1 border">Lote</th>
                            <th className="px-2 py-1 border">Nota Fiscal</th>
                            <th className="px-2 py-1 border">Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicoesParciais[obraMedicaoSelecionada.obra].map((med, idx) => (
                            <tr key={idx}>
                              <td className="px-2 py-1 border text-center">{med.dataMedicao}</td>
                              <td className="px-2 py-1 border text-center">R$ {med.valorMedido}</td>
                              <td className="px-2 py-1 border text-center">{med.numeroLote}</td>
                              <td className="px-2 py-1 border text-center">{med.numeroNotaFiscal}</td>
                              <td className="px-2 py-1 border text-center">{med.observacoes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-muted-foreground text-xs">Nenhuma medição parcial registrada.</div>
                    )}
                  </div>
                </div>
                {/* Novo bloco customizado */}
                <div className="mt-8 p-4 border rounded-lg bg-muted">
                  <h4 className="text-base font-bold mb-2">Mão de Obra Enviada</h4>
                                  
                                  <div className="mb-4 flex gap-2 items-end">
                                    <select
                                      value={tipoMOEnv}
                                      onChange={e => setTipoMOEnv(e.target.value)}
                                      className="px-2 py-1 border rounded w-40"
                                    >
                                      <option value="">Selecione o tipo</option>
                                      <option value="LV">Linha Viva</option>
                                      <option value="LM">Linha Morta</option>
                                    </select>
                                      <Input
                                        placeholder="Código ou descrição"
                                        value={novoMOEnv.descricao}
                                        onChange={e => setNovoMOEnv({ ...novoMOEnv, descricao: e.target.value })}
                                        className="flex-1"
                                        list="maoDeObraOptions"
                                      />
                                    <datalist id="maoDeObraOptions">
                                      {opcoesMO.map(mo => (
                                        <option key={mo.codigo_mao_de_obra + mo.descricao} value={`${mo.codigo_mao_de_obra} - ${mo.descricao}`} />
                                      ))}
                                    </datalist>
                                      <Input
                                        placeholder="Qtd"
                                        type="number"
                                        value={String(novoMOEnv.quantidadeInstalada)}
                                        onChange={e => setNovoMOEnv({ ...novoMOEnv, quantidadeInstalada: Number(e.target.value) })}
                                        className="w-16"
                                      />
                                    <Button onClick={handleAdicionarEnv}>
                                      Adicionar
                                    </Button>
                                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-2 py-1 border text-center">ITEM</th>
                          <th className="px-2 py-1 border text-center">Tipo</th>
                          <th className="px-2 py-1 border text-center">Cód</th>
                          <th className="px-2 py-1 border">Mão de Obra</th>
                          <th className="px-2 py-1 border text-center">Un</th>
                          <th className="px-2 py-1 border text-center">UPS</th>
                          <th className="px-2 py-1 border text-center">Valor unit. (R$)</th>
                          <th className="px-2 py-1 border text-center">Qtd</th>
                          <th className="px-2 py-1 border text-center">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maoDeObraUtilizada.map((mo, idx) => {
                          const valores = calcularValoresMo(mo);
                          return (
                            <tr key={mo.codigo || `${idx}-${mo.descricao}`}>
                              <td className="px-2 py-1 border text-center">{idx + 1}</td>
                              <td className="px-2 py-1 border text-center">{valores.tipo || "-"}</td>
                              <td className="px-2 py-1 border text-center">{mo.codigo || "-"}</td>
                              <td className="px-2 py-1 border">{mo.descricao}</td>
                              <td className="px-2 py-1 border text-center">{valores.unidade}</td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorUnitarioFracao.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorUnitarioConfigurado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {Number.isFinite(valores.quantidade) ? valores.quantidade.toFixed(2) : "-"}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Rodapé de total */}
                        <tr>
                          <td className="px-2 py-1 border text-center" colSpan={8} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            R$
                          </td>
                          <td className="px-2 py-1 border text-center" style={{ fontWeight: 'bold' }}>
                            {totalValorMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Bloco duplicado independente */}
                <div className="mt-8 p-4 border rounded-lg bg-muted">
                  <h4 className="text-base font-bold mb-2">Mão de Obra Recebida</h4>
                  <div className="mb-4 flex gap-2 items-end">
                    <select
                      value={tipoMORecebida}
                      onChange={e => setTipoMORecebida(e.target.value)}
                      className="px-2 py-1 border rounded w-40"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="LV">Linha Viva</option>
                      <option value="LM">Linha Morta</option>
                    </select>
                    <Input
                      placeholder="Código ou descrição"
                      value={novoMORecebida.descricao}
                      onChange={e => setNovoMORecebida({ ...novoMORecebida, descricao: e.target.value })}
                      className="flex-1"
                      list="maoDeObraOptions"
                    />
                    <datalist id="maoDeObraOptions">
                      {opcoesMO.map(mo => (
                        <option key={mo.codigo_mao_de_obra + mo.descricao} value={`${mo.codigo_mao_de_obra} - ${mo.descricao}`} />
                      ))}
                    </datalist>
                    <Input
                      placeholder="Qtd"
                      type="number"
                      value={String(novoMORecebida.quantidadeInstalada)}
                      onChange={e => setNovoMORecebida({ ...novoMORecebida, quantidadeInstalada: Number(e.target.value) })}
                      className="w-16"
                    />
                    <Button onClick={handleAdicionarRecebida}>
                      Adicionar
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-xs">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-2 py-1 border text-center">ITEM</th>
                          <th className="px-2 py-1 border text-center">Tipo</th>
                          <th className="px-2 py-1 border text-center">Cód</th>
                          <th className="px-2 py-1 border">Mão de Obra</th>
                          <th className="px-2 py-1 border text-center">Un</th>
                          <th className="px-2 py-1 border text-center">UPS</th>
                          <th className="px-2 py-1 border text-center">Valor unit. (R$)</th>
                          <th className="px-2 py-1 border text-center">Qtd</th>
                          <th className="px-2 py-1 border text-center">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maoDeObraRecebida.map((mo, idx) => {
                          const valores = calcularValoresMo(mo);
                          return (
                            <tr key={mo.codigo || `${idx}-${mo.descricao}`}>
                              <td className="px-2 py-1 border text-center">{idx + 1}</td>
                              <td className="px-2 py-1 border text-center">{valores.tipo || "-"}</td>
                              <td className="px-2 py-1 border text-center">{mo.codigo || "-"}</td>
                              <td className="px-2 py-1 border">{mo.descricao}</td>
                              <td className="px-2 py-1 border text-center">{valores.unidade}</td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorUnitarioFracao.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorUnitarioConfigurado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {Number.isFinite(valores.quantidade) ? valores.quantidade.toFixed(2) : "-"}
                              </td>
                              <td className="px-2 py-1 border text-center">
                                {valores.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td className="px-2 py-1 border text-center" colSpan={8} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            R$
                          </td>
                          <td className="px-2 py-1 border text-center" style={{ fontWeight: 'bold' }}>
                            {totalValorMaoDeObraRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="secondary" onClick={handleSalvarMedicoes}>Salvar</Button>
              <Button variant="outline" onClick={() => setModalObraMedicaoOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de obras em execução */}
        <Dialog open={execucaoModalOpen} onOpenChange={setExecucaoModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Obras em Execução</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Obras com status "execução" e sem data de término.</p>
            </DialogHeader>
            <div className="grid gap-3">
              {obras.filter(o => o.status === "execucao" && (!o.dataPrevisaoTermino && !o.dataTerminoObra)).length === 0 ? (
                <div className="py-4 text-muted-foreground">Nenhuma obra em execução no momento.</div>
              ) : (
                obras
                  .filter(o => o.status === "execucao" && (!o.dataPrevisaoTermino && !o.dataTerminoObra))
                  .map((obra) => (
                    <Card key={obra.obra} className="border shadow-sm cursor-pointer" onClick={() => { setObraExecucaoSelecionada(obra); setModalExecucaoDetalheOpen(true); }}>
                      <CardHeader className="py-2">
                        <CardTitle className="text-base font-bold">{obra.obra}</CardTitle>
                        <CardDescription>OS: {obra.os} | Cidade: {obra.cidade}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div>Status: <Badge variant="secondary">{obra.status}</Badge></div>
                        <div>Início: {obra.inicio || "-"}</div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        {/* Dialog Medições (detalhe da execução) */}
        <Dialog open={modalExecucaoDetalheOpen} onOpenChange={setModalExecucaoDetalheOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Obra em Execução: {obraExecucaoSelecionada?.obra}</DialogTitle>
            </DialogHeader>
            {obraExecucaoSelecionada && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Data Término da Obra</label>
                    <Input type="date" value={obraExecucaoSelecionada.dataTerminoObra || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, dataTerminoObra: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Qtde. Postes</label>
                    <Input type="number" value={obraExecucaoSelecionada.qtdePostes || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, qtdePostes: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Qtde. Trafo/Equipamento</label>
                    <Input value={obraExecucaoSelecionada.qtdeTrafoEquipamento || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, qtdeTrafoEquipamento: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Patrimônio Instalado</label>
                    <Input value={obraExecucaoSelecionada.patrimonioInstalado || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, patrimonioInstalado: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Patrimônio Retirado</label>
                    <Input value={obraExecucaoSelecionada.patrimonioRetirado || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, patrimonioRetirado: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Placa PT/Eq. Cadastro</label>
                    <Input value={obraExecucaoSelecionada.placaPtEqCadastro || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, placaPtEqCadastro: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">KM Inicial</label>
                    <Input type="number" value={obraExecucaoSelecionada.kmInicial || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, kmInicial: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">KM Final</label>
                    <Input type="number" value={obraExecucaoSelecionada.kmFinal || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, kmFinal: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">KM Rodado</label>
                    <Input type="number" value={obraExecucaoSelecionada.kmFinal && obraExecucaoSelecionada.kmInicial ? obraExecucaoSelecionada.kmFinal - obraExecucaoSelecionada.kmInicial : ''} readOnly />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium">Observações</label>
                    <Input value={obraExecucaoSelecionada.observacoes || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, observacoes: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Encerradas</label>
                    <select value={obraExecucaoSelecionada.encerradas || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, encerradas: e.target.value })} className="border rounded px-2 py-1 focus:outline-none focus:ring w-full">
                      <option value="">Selecione</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Fiscal Energisa</label>
                    <Input value={obraExecucaoSelecionada.fiscalEnergisa || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, fiscalEnergisa: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Número Caixa</label>
                    <Input value={obraExecucaoSelecionada.numeroCaixa || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, numeroCaixa: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium">Motivo Atraso</label>
                    <Input value={obraExecucaoSelecionada.motivoAtraso || ''} onChange={e => setObraExecucaoSelecionada({ ...obraExecucaoSelecionada, motivoAtraso: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModalExecucaoDetalheOpen(false)}>Cancelar</Button>
                  <Button variant="secondary" onClick={() => setModalMedicaoParcialOpen(true)}>
                    Realizar Medição Parcial
                  </Button>
                  <Button
                    onClick={() => {
                      // Campos obrigatórios para migrar para medições
                      const obrigatorios = [
                        'dataTerminoObra',
                        'qtdePostes',
                        'qtdeTrafoEquipamento',
                        'patrimonioInstalado',
                        'patrimonioRetirado',
                        'placaPtEqCadastro',
                        'kmInicial',
                        'kmFinal',
                      ];
                      const faltando = obrigatorios.filter(
                        (campo) => !obraExecucaoSelecionada[campo] || obraExecucaoSelecionada[campo].toString().trim() === ''
                      );
                      if (faltando.length > 0) {
                        alert('Preencha todos os campos obrigatórios para encerrar a execução:\n- Data Término da Obra\n- Qtde. Postes\n- Qtde. Trafo/Equipamento\n- Patrimônio Instalado\n- Patrimônio Retirado\n- Placa PT/Eq. Cadastro\n- KM Inicial\n- KM Final');
                        return;
                      }
                      setObras(prevObras => prevObras.map(o =>
                        o.obra === obraExecucaoSelecionada.obra
                          ? { ...o, ...obraExecucaoSelecionada, status: 'medicao' }
                          : o
                      ));
                      setModalExecucaoDetalheOpen(false);
                    }}
                  >Salvar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Medição Parcial independente - múltiplas medições */}
        <Dialog open={modalMedicaoParcialOpen} onOpenChange={setModalMedicaoParcialOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Medição Parcial - {obraExecucaoSelecionada?.obra}</DialogTitle>
            </DialogHeader>
            {/* Lista de medições parciais já realizadas */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Medições parciais realizadas:</h4>
              {(obraExecucaoSelecionada && medicoesParciais[obraExecucaoSelecionada.obra]?.length > 0) ? (
                <ul className="list-disc pl-4">
                  {medicoesParciais[obraExecucaoSelecionada.obra].map((med, idx) => (
                    <li key={idx} className="mb-1">
                      {med.dataMedicao} - R$ {med.valorMedido} - Lote: {med.numeroLote} - NF: {med.numeroNotaFiscal}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground text-xs">Nenhuma medição parcial registrada.</div>
              )}
            </div>
            {/* Formulário para nova medição parcial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Data da Medição</label>
                <Input type="date" value={novaMedicaoParcial.dataMedicao} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, dataMedicao: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Valor Medido Parcialmente (R$)</label>
                <Input type="number" min="0" step="0.01" value={novaMedicaoParcial.valorMedido} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, valorMedido: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Número do Lote</label>
                <Input type="text" value={novaMedicaoParcial.numeroLote} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, numeroLote: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Data do Lote</label>
                <Input type="date" value={novaMedicaoParcial.dataLote} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, dataLote: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Número da Nota Fiscal</label>
                <Input type="text" value={novaMedicaoParcial.numeroNotaFiscal} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, numeroNotaFiscal: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Data da Nota Fiscal</label>
                <Input type="date" value={novaMedicaoParcial.dataNotaFiscal} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, dataNotaFiscal: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <Input type="text" value={novaMedicaoParcial.observacoes} onChange={e => setNovaMedicaoParcial({ ...novaMedicaoParcial, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalMedicaoParcialOpen(false)}>Cancelar</Button>
              <Button onClick={() => {
                if (!obraExecucaoSelecionada) return;
                // Adiciona nova medição parcial à obra
                setMedicoesParciais(prev => {
                  const lista = prev[obraExecucaoSelecionada.obra] || [];
                  return {
                    ...prev,
                    [obraExecucaoSelecionada.obra]: [...lista, novaMedicaoParcial],
                  };
                });
                setNovaMedicaoParcial({
                  dataMedicao: '',
                  valorMedido: '',
                  numeroLote: '',
                  dataLote: '',
                  numeroNotaFiscal: '',
                  dataNotaFiscal: '',
                  observacoes: '',
                });
              }}>Salvar Medição</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de obras</CardTitle>
              <CardDescription>Obras de longo prazo com OS interna e status de TCI/Aprovação.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowRight className="h-4 w-4" />
              Filtros avançados (breve)
            </Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra (Energisa)</TableHead>
                <TableHead>OS (interna)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TCI</TableHead>
                <TableHead>Gestor</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((item) => (
                <TableRow
                  key={item.obra}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/obras/${item.obra}`)}
                >
                  <TableCell className="font-semibold">{item.obra}</TableCell>
                  <TableCell>{item.os}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.tci === "validado" ? "default" : "outline"}>{item.tci}</Badge>
                  </TableCell>
                  <TableCell>{item.gestor}</TableCell>
                  <TableCell>{item.cidade}</TableCell>
                  <TableCell>{item.inicio}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Obras;
