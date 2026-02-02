// import { maoDeObraCatalog } from "@/data/maoDeObraCatalog";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { equipesCatalog } from "@/data/equipesCatalog";
// Adicione a dependência xlsx no seu projeto: npm install xlsx
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { WorkflowStepsObras } from "@/components/domain/WorkflowStepsObras";
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

const workflowStages = ["planejamento", "execucao", "medicao", "tci", "aprovacao", "faturamento", "finalizado"];
const getNextStage = (currentStatus: string) => {
  const index = workflowStages.indexOf(currentStatus);
  if (index === -1 || index === workflowStages.length - 1) return currentStatus;
  return workflowStages[index + 1];
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
  const [maoDeObraEnviadaSalva, setMaoDeObraEnviadaSalva] = useState<any[]>([]);
  const [negociacaoStatus, setNegociacaoStatus] = useState<"negociacao" | "finalizado">("negociacao");
  const [modalObraMedicaoOpen, setModalObraMedicaoOpen] = useState(false);
  const [modalMedicoesOpen, setModalMedicoesOpen] = useState(false);
  const [modalMedicaoParcialOpen, setModalMedicaoParcialOpen] = useState(false);
  const [modalTciOpen, setModalTciOpen] = useState(false);
  const [obraTciSelecionada, setObraTciSelecionada] = useState<any>(null);
  const [tciObservacoes, setTciObservacoes] = useState("");
  const [modalTciDetalheOpen, setModalTciDetalheOpen] = useState(false);
  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);
  const [modalAprovacaoDetalheOpen, setModalAprovacaoDetalheOpen] = useState(false);
  const [obraAprovacaoSelecionada, setObraAprovacaoSelecionada] = useState<any>(null);
  const [aprovacaoComentarios, setAprovacaoComentarios] = useState("");
  const [aprovacaoData, setAprovacaoData] = useState("");
  const [aprovacaoAnexoName, setAprovacaoAnexoName] = useState<string | null>(null);
  const aprovacaoAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [aprovacaoMensagem, setAprovacaoMensagem] = useState<string | null>(null);
  const [modalFaturamentoOpen, setModalFaturamentoOpen] = useState(false);
  const [modalFaturamentoDetalheOpen, setModalFaturamentoDetalheOpen] = useState(false);
  const [obraFaturamentoSelecionada, setObraFaturamentoSelecionada] = useState<any>(null);
  const [notaFiscal, setNotaFiscal] = useState("");
  const [dataFaturamento, setDataFaturamento] = useState("");
  const [numeroLoteFaturamento, setNumeroLoteFaturamento] = useState("");
  const [dataLoteGeracao, setDataLoteGeracao] = useState("");
  const [faturamentoAnexoName, setFaturamentoAnexoName] = useState<string | null>(null);
  const [faturamentoComentarios, setFaturamentoComentarios] = useState("");
  const faturamentoAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const triggerFaturamentoAttachmentUpload = () => faturamentoAttachmentInputRef.current?.click();
  useEffect(() => {
    if (!modalAprovacaoDetalheOpen) {
      setAprovacaoMensagem(null);
      setAprovacaoComentarios("");
      setAprovacaoData("");
      setAprovacaoAnexoName(null);
    }
  }, [modalAprovacaoDetalheOpen]);

  useEffect(() => {
    if (!modalFaturamentoDetalheOpen) {
      setNotaFiscal("");
      setDataFaturamento("");
      setFaturamentoAnexoName(null);
      setFaturamentoComentarios("");
      setNumeroLoteFaturamento("");
      setDataLoteGeracao("");
    }
  }, [modalFaturamentoDetalheOpen]);

  const triggerAprovacaoAttachmentUpload = () => aprovacaoAttachmentInputRef.current?.click();
  const [registrosTratativas, setRegistrosTratativas] = useState<Record<
    string,
    { tipo: string; data: string; observacoes: string; anexo?: string | null }[]
  >>({});
  const [tciTab, setTciTab] = useState<"registro" | "detalhes">("registro");
  const [registroTipo, setRegistroTipo] = useState<
    "DITAIS" | "APR" | "ESCANEAR PROJETO AS BUILTS" | "BOOK" | "TCI APRESENTADO" | "TCI APROVADO"
  >("DITAIS");
  const [registroData, setRegistroData] = useState("");
  const [tciAnexoName, setTciAnexoName] = useState<string | null>(null);
  const tciAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const triggerTciAttachmentUpload = () => tciAttachmentInputRef.current?.click();

  // Busca dinâmica dos códigos de mão de obra do Supabase
  useEffect(() => {
    if (!tipoMOEnv && !novoMOEnv.descricao.trim()) {
      setOpcoesMO([]);
      return;
    }
    const handler = setTimeout(async () => {
      setLoadingMO(true);
      let query = supabase
        .from('codigos_mao_de_obra')
        .select('codigo_mao_de_obra, descricao, tipo, unidade, ups')
        .eq('ativo', true)
        .order('codigo_mao_de_obra', { ascending: true });
      if (tipoMOEnv) {
        query = query.eq('tipo', tipoMOEnv);
      }
      if (novoMOEnv.descricao.trim()) {
        query = query.or(
          `codigo_mao_de_obra.ilike.%${novoMOEnv.descricao.trim()}%,descricao.ilike.%${novoMOEnv.descricao.trim()}%`
        );
      }
      const { data, error } = await query.limit(20);
      if (!error && data) setOpcoesMO(data);
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
      const { data: fetched } = await supabase
        .from("codigos_mao_de_obra")
        .select("codigo_mao_de_obra, descricao, unidade, tipo, ups")
        .eq("codigo_mao_de_obra", codigoLookup)
        .maybeSingle();
      matchOption = fetched || null;
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
    const updatedObra = {
      ...obraMedicaoSelecionada,
      maoDeObraUtilizada: novaLista,
    };
    const avancadoStatus =
      negociacaoStatus === "finalizado"
        ? getNextStage(updatedObra.status || "medicao")
        : updatedObra.status;
    const finalObra = { ...updatedObra, status: avancadoStatus };
    setObraMedicaoSelecionada(finalObra);
    setMaoDeObraEnviadaSalva(novaLista);
    setObras((prev) =>
      prev.map((obra) =>
        obra.obra === finalObra.obra ? { ...obra, maoDeObraUtilizada: novaLista, status: finalObra.status } : obra
      )
    );
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

  const handleRemoverMaoDeObraEnviada = (index: number) => {
    if (!obraMedicaoSelecionada) return;
    const novaLista = maoDeObraUtilizada.filter((_, idx) => idx !== index);
    const updatedObra = { ...obraMedicaoSelecionada, maoDeObraUtilizada: novaLista };
    setObraMedicaoSelecionada(updatedObra);
    setMaoDeObraEnviadaSalva(novaLista);
    setObras((prev) =>
      prev.map((obra) => (obra.obra === updatedObra.obra ? { ...obra, maoDeObraUtilizada: novaLista } : obra))
    );
  };

  const handleRemoverMaoDeObraRecebida = (index: number) => {
    setMaoDeObraRecebida((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSalvarTratativa = () => {
    if (!obraTciSelecionada) return;
    const atualizado = { ...obraTciSelecionada, observacoesTci: tciObservacoes };
    if (registroTipo === "TCI APROVADO") {
      const proximo = getNextStage(atualizado.status || "tci");
      atualizado.status = proximo;
      setObraTciSelecionada((prev) => (prev ? { ...prev, status: proximo } : prev));
    }
    setObras((prev) => prev.map((obra) => (obra.obra === atualizado.obra ? atualizado : obra)));
    setRegistrosTratativas((prev) => {
      const listaAtual = prev[atualizado.obra] || [];
      return {
        ...prev,
        [atualizado.obra]: [
          {
            tipo: registroTipo,
            data: registroData || new Date().toISOString(),
            observacoes: tciObservacoes,
            anexo: tciAnexoName,
          },
          ...listaAtual,
        ],
      };
    });
    toast({
      title: "Tratativa registrada",
      description: `Observações salvas para ${atualizado.obra}.`,
      variant: "success",
    });
  };

  const handleSelectObraTci = (obra: any) => {
    setObraTciSelecionada(obra);
    setTciObservacoes(obra.observacoesTci || "");
    setModalTciDetalheOpen(true);
    setModalTciOpen(false);
  };

  const handleSelectObraAprovacao = (obra: any) => {
    setObraAprovacaoSelecionada(obra);
    setAprovacaoComentarios(obra.aprovacaoComentarios || "");
    setModalAprovacaoDetalheOpen(true);
  };

  const handleSalvarAprovacao = () => {
    if (!obraAprovacaoSelecionada) return;
    if (!aprovacaoData || !aprovacaoAnexoName) {
      toast({
        title: "Dados incompletos",
        description: "Informe a data e anexe o email para finalizar a aprovação.",
        variant: "destructive",
      });
      return;
    }
    const proximoStatus = getNextStage(obraAprovacaoSelecionada.status || "aprovacao");
    const atualizado = {
      ...obraAprovacaoSelecionada,
      status: proximoStatus,
      aprovacaoComentarios: aprovacaoComentarios || undefined,
      dataAprovacao: aprovacaoData,
      anexoAprovacao: aprovacaoAnexoName,
    };
    setObras((prev) => prev.map((obra) => (obra.obra === atualizado.obra ? atualizado : obra)));
    setObraAprovacaoSelecionada(atualizado);
    setAprovacaoMensagem(`Obra ${atualizado.obra} movida para ${proximoStatus}.`);
    setModalAprovacaoDetalheOpen(false);
  };

  const handleSelectObraFaturamento = (obra: any) => {
    setObraFaturamentoSelecionada(obra);
    setModalFaturamentoDetalheOpen(true);
    setModalFaturamentoOpen(false);
  };

  useEffect(() => {
    if (!obraFaturamentoSelecionada) return;
    setNotaFiscal(obraFaturamentoSelecionada.notaFiscal || "");
    setDataFaturamento(obraFaturamentoSelecionada.dataFaturamento || "");
    setNumeroLoteFaturamento(obraFaturamentoSelecionada.numeroLoteFaturamento || "");
    setDataLoteGeracao(obraFaturamentoSelecionada.dataLoteGeracao || "");
    setFaturamentoComentarios(obraFaturamentoSelecionada.comentariosFaturamento || "");
    setFaturamentoAnexoName(obraFaturamentoSelecionada.anexoFaturamento || null);
  }, [obraFaturamentoSelecionada]);

  const handleSalvarFaturamento = () => {
    if (!obraFaturamentoSelecionada) return;
    if (!notaFiscal || !dataFaturamento || !numeroLoteFaturamento || !dataLoteGeracao) {
      toast({
        title: "Dados obrigatórios",
        description: "Informe NF, data, lote e data de geração antes de registrar o faturamento.",
        variant: "destructive",
      });
      return;
    }
    const proximoStatus = getNextStage(obraFaturamentoSelecionada.status || "faturamento");
    const atualizado = {
      ...obraFaturamentoSelecionada,
      status: proximoStatus,
      notaFiscal,
      dataFaturamento,
      numeroLoteFaturamento,
      dataLoteGeracao,
      anexoFaturamento: faturamentoAnexoName || undefined,
      comentariosFaturamento: faturamentoComentarios || undefined,
    };
    setObras((prev) => prev.map((obra) => (obra.obra === atualizado.obra ? atualizado : obra)));
    setObraFaturamentoSelecionada(atualizado);
    toast({
      title: "Faturamento registrado",
      description: `NF ${notaFiscal} registrada para ${atualizado.obra}.`,
      variant: "success",
    });
    setModalFaturamentoDetalheOpen(false);
  };

  const handleSalvarLote = () => {
    if (!obraFaturamentoSelecionada) return;
    if (!numeroLoteFaturamento || !dataLoteGeracao) {
      toast({
        title: "Dados de lote",
        description: "Informe número e data do lote antes de salvar.",
        variant: "destructive",
      });
      return;
    }
    const atualizado = {
      ...obraFaturamentoSelecionada,
      numeroLoteFaturamento,
      dataLoteGeracao,
      loteBloqueado: true,
    };
    setObras((prev) => prev.map((obra) => (obra.obra === atualizado.obra ? atualizado : obra)));
    setObraFaturamentoSelecionada(atualizado);
    toast({
      title: "Lote registrado",
      description: `Lote ${numeroLoteFaturamento} salvo para ${atualizado.obra}.`,
      variant: "success",
    });
  };

  useEffect(() => {
    const loadUpsConfigs = async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("chave, valor")
        .in("chave", ["ups_valor_lm", "ups_valor_lv"]);
      if (error || !data) return;
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
    const atualizado = {
      ...obraMedicaoSelecionada,
      negociacaoStatus,
    };
    const avancadoStatus =
      negociacaoStatus === "finalizado"
        ? getNextStage(obraMedicaoSelecionada.status || "medicao")
        : obraMedicaoSelecionada.status;
    const obraAtualizadaComStatus = { ...atualizado, status: avancadoStatus };
    const payload = {
      obra: obraAtualizadaComStatus.obra,
      mediçõesParciais: medicoesParciais[obraAtualizadaComStatus.obra] || [],
      maoDeObraEnviada: maoDeObraEnviadaSalva,
      maoDeObraRecebida: maoDeObraRecebida,
      totalEnviada: maoDeObraEnviadaSalva.reduce((acc, mo) => acc + calcularValoresMo(mo).valorTotal, 0),
      totalMedicoesParciais,
      totalRecebida: totalValorMaoDeObraRecebida,
      totalConsolidado: valorFinalRecebido,
      valorFaltante,
      negociacaoStatus,
      savedAt: new Date().toISOString(),
    };
    setObraMedicaoSelecionada(obraAtualizadaComStatus);
    setObras((prev) =>
      prev.map((obra) =>
        obra.obra === obraAtualizadaComStatus.obra
          ? { ...obra, maoDeObraUtilizada: obraAtualizadaComStatus.maoDeObraUtilizada, status: obraAtualizadaComStatus.status }
          : obra
      )
    );
    setMedicoesSalvas(payload);
    setSalvoRecentemente(true);
    toast({
      title: "Medições salvas",
      description: "Todas as entradas do modal foram gravadas com sucesso.",
      variant: "success",
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
      status: "faturamento",
      tci: "validado",
      gestor: "aprovado",
      cidade: "Cuiaba",
      inicio: "15/12/2025",
      encerradas: "",
      dataPrevisaoTermino: "",
      dataTerminoObra: ""
    },
  ]);
 
  useEffect(() => {
    if (!modalObraMedicaoOpen) return;
    setNegociacaoStatus(obraMedicaoSelecionada?.negociacaoStatus || "negociacao");
  }, [modalObraMedicaoOpen, obraMedicaoSelecionada]);

  const obrasEmTci = useMemo(() => obras.filter((obra) => obra.status === "tci"), [obras]);
  const obrasEmAprovacao = useMemo(() => obras.filter((obra) => obra.status === "aprovacao"), [obras]);
  const obrasEmFaturamento = useMemo(() => obras.filter((obra) => obra.status === "faturamento"), [obras]);

  useEffect(() => {
    if (!modalTciOpen) return;
    if (obrasEmTci.length === 0) {
      setObraTciSelecionada(null);
      setTciObservacoes("");
      return;
    }
    const first = obrasEmTci[0];
    setObraTciSelecionada(first);
    setTciObservacoes(first.observacoesTci || "");
  }, [modalTciOpen, obrasEmTci]);

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
          {/* Modal Planejamento permanece acess�vel apenas pela r�gua de etapas */}
        <Dialog open={planejamentoModalOpen} onOpenChange={setPlanejamentoModalOpen}>
          <DialogContent className="max-w-2xl rounded-2xl border border-muted/60 bg-white shadow-lg">
            <DialogHeader>
              <DialogTitle>Planejamento</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Obras sem marco inicial</p>
            </DialogHeader>
            <div className="space-y-4 px-4 pb-4">
              {obrasSemMarcoInicial.length === 0 ? (
                <div className="py-4 text-muted-foreground">Todas as obras sem marco inicial.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {obrasSemMarcoInicial.map((item) => (
                    <Card
                      key={item.obra}
                      className="border shadow-sm cursor-pointer rounded-2xl hover:border-primary transition-colors"
                      onClick={() => {
                        setObraSelecionada(item);
                        setDetalheObraModalOpen(true);
                      }}
                    >
                      <CardHeader className="py-4 text-center">
                        <CardTitle className="text-lg font-bold">{item.obra || "Sem n�mero"}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={detalheObraModalOpen} onOpenChange={setDetalheObraModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da obra: {obraSelecionada?.obra}</DialogTitle>
            </DialogHeader>
            {obraSelecionada && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">In�cio F�sico da Obra</label>
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
                  <span className="text-xs text-muted-foreground mt-1">Clique novamente para remover uma equipe j� selecionada.</span>
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
                  <label className="text-sm font-medium">Previs�o de T�rmino</label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 focus:outline-none focus:ring w-full"
                    value={obraSelecionada.dataPrevisaoTermino || ''}
                    onChange={e => setObraSelecionada({ ...obraSelecionada, dataPrevisaoTermino: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setDetalheObraModalOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() => {
                    if (!obraSelecionada) return;
                    setObras(prevObras => prevObras.map(o => {
                      if (o.obra === obraSelecionada.obra) {
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
            )}
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
            if (etapa.title === "TCI / Tratativas") clickHandler = () => setModalTciOpen(true);
            if (etapa.title === "Aprovação") clickHandler = () => setModalAprovacaoOpen(true);
            if (etapa.title === "Faturamento") clickHandler = () => setModalFaturamentoOpen(true);
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status da negociação</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        { label: "Valor será finalizado", value: "finalizado" },
                        { label: "Ainda em negociação", value: "negociacao" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-full cursor-pointer transition ${
                            negociacaoStatus === option.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          <input
                            type="radio"
                            name="negociacaoStatus"
                            value={option.value}
                            checked={negociacaoStatus === option.value}
                            onChange={() => setNegociacaoStatus(option.value as "negociacao" | "finalizado")}
                            className="hidden"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
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
                            <th className="px-2 py-1 border text-center">Ações</th>
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
                                <td className="px-2 py-1 border text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoverMaoDeObraEnviada(idx)}
                                  >
                                    Remover
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        {/* Rodapé de total */}
                          <tr>
                            <td className="px-2 py-1 border text-center" colSpan={9} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                              R$
                            </td>
                            <td className="px-2 py-1 border text-center" style={{ fontWeight: 'bold' }}>
                              {totalValorMaoDeObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-1 border text-center" />
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
                            <th className="px-2 py-1 border text-center">Ações</th>
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
                                <td className="px-2 py-1 border text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoverMaoDeObraRecebida(idx)}
                                  >
                                    Remover
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td className="px-2 py-1 border text-center" colSpan={9} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                              R$
                            </td>
                            <td className="px-2 py-1 border text-center" style={{ fontWeight: 'bold' }}>
                              {totalValorMaoDeObraRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-1 border text-center" />
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
        {/* Modal TCI / Tratativas */}
        <Dialog open={modalTciOpen} onOpenChange={setModalTciOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>TCI / Tratativas</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Registre ajustes, pendências e tratativas das obras que passaram pela consolidação.</p>
            </DialogHeader>
            <div className="space-y-4">
              {obrasEmTci.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma obra em TCI no momento.</div>
              ) : (
                <div className="grid gap-3">
                  {obrasEmTci.map((obra) => (
                    <Card
                      key={obra.obra}
                      className={`border shadow-sm cursor-pointer transition-colors ${
                        obraTciSelecionada?.obra === obra.obra ? "border-primary bg-white" : "hover:border-primary"
                      }`}
                      onClick={() => handleSelectObraTci(obra)}
                    >
                      <CardHeader className="py-2">
                        <CardTitle className="text-base font-bold">{obra.obra}</CardTitle>
                        <CardDescription>OS: {obra.os} · {obra.cidade}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm flex flex-wrap gap-4">
                        <Badge variant="secondary">{obra.status}</Badge>
                        <span className="text-muted-foreground">Gestor: {obra.gestor || "—"}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={modalTciDetalheOpen} onOpenChange={(open) => {
          if (!open) {
            setModalTciDetalheOpen(false);
            setObraTciSelecionada(null);
          } else {
            setModalTciDetalheOpen(true);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tratativa · {obraTciSelecionada?.obra}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Registre ajustes, pendências e tratativas dos livros.
              </p>
            </DialogHeader>
            {obraTciSelecionada && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-muted/60 bg-white p-4 shadow-sm">
                  <div className="flex gap-2 rounded-full border border-muted/70 bg-muted/70 p-1">
                    {["registro", "detalhes"].map((tab) => (
                      <button
                        key={tab}
                        className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                          tab === tciTab ? "bg-foreground text-white shadow-sm" : "text-muted-foreground"
                        }`}
                        onClick={() => setTciTab(tab as "registro" | "detalhes")}
                      >
                        {tab === "registro" ? "Registro" : "Detalhes"}
                      </button>
                    ))}
                  </div>
                </div>
                {tciTab === "registro" ? (
                  <div className="rounded-2xl border bg-white p-4 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tipo de registro
                        </label>
                        <select
                          value={registroTipo}
                          onChange={(e) => setRegistroTipo(e.target.value as typeof registroTipo)}
                          className="w-full border rounded px-3 py-2 text-sm"
                        >
                          <option value="DITAIS">DITAIS</option>
                          <option value="APR">APR</option>
                          <option value="ESCANEAR PROJETO AS BUILTS">ESCANEAR PROJETO AS BUILTS</option>
                          <option value="BOOK">BOOK</option>
                          <option value="TCI APRESENTADO">TCI APRESENTADO</option>
                          <option value="TCI APROVADO">TCI APROVADO</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Data/hora do envio
                        </label>
                        <Input
                          type="datetime-local"
                          value={registroData}
                          onChange={(e) => setRegistroData(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observações
                    </label>
                    <textarea
                      value={tciObservacoes}
                      onChange={(e) => setTciObservacoes(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 min-h-[140px] text-sm focus:outline-none focus:ring"
                      placeholder="Descreva pendências, documentos solicitados ou tratativas realizadas..."
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Anexar e-mail (.msg)
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="file"
                          accept=".msg"
                          ref={tciAttachmentInputRef}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            setTciAnexoName(file?.name ?? null);
                            if (e.target) e.target.value = "";
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={triggerTciAttachmentUpload}>
                          Selecionar arquivo
                        </Button>
                        {tciAnexoName && <span className="text-xs text-muted-foreground">{tciAnexoName}</span>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalTciDetalheOpen(false)}>Fechar</Button>
                      <Button onClick={handleSalvarTratativa}>Salvar tratativa</Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-white p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros salvos</p>
                    {registrosTratativas[obraTciSelecionada.obra]?.length ? (
                      registrosTratativas[obraTciSelecionada.obra].map((registro, idx) => (
                        <div key={`${registro.data}-${idx}`} className="rounded-lg border border-muted/60 bg-muted/40 p-3 text-sm">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{registro.tipo}</span>
                            <span>{registro.data ? new Date(registro.data).toLocaleString("pt-BR") : "--"}</span>
                          </div>
                          <p className="mt-1 text-foreground">{registro.observacoes || "Sem observações"}</p>
                          {registro.anexo && (
                            <p className="text-xs text-muted-foreground mt-1">Anexo: {registro.anexo}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-muted/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                        Nenhum registro ainda. As tratativas salvas aparecerão aqui.
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setModalTciDetalheOpen(false)}>Fechar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={modalAprovacaoOpen} onOpenChange={setModalAprovacaoOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aprovação</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Finalize o fluxo e acompanhe as obras liberadas para faturamento.</p>
            </DialogHeader>
            <div className="space-y-4 pb-4">
              {obrasEmAprovacao.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma obra aguardando aprovação.</div>
              ) : (
                obrasEmAprovacao.map((obra) => (
                  <Card
                    key={obra.obra}
                    className="rounded-2xl border border-primary/70 bg-white px-5 py-4 shadow-sm cursor-pointer"
                    onClick={() => handleSelectObraAprovacao(obra)}
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Obra em foco</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-foreground">{obra.obra}</div>
                        <div className="text-sm text-muted-foreground">OS: {obra.os} · {obra.cidade}</div>
                      </div>
                      <Badge variant="secondary">{obra.status}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">tci</span>
                      <span className="text-muted-foreground">Gestor: {obra.gestor || "pendente"}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={modalAprovacaoDetalheOpen} onOpenChange={(open) => {
          if (!open) {
            setModalAprovacaoDetalheOpen(false);
            setObraAprovacaoSelecionada(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aprovação · {obraAprovacaoSelecionada?.obra}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Registre pendências do gestor ou finalize o envio para faturamento.</p>
            </DialogHeader>
            {obraAprovacaoSelecionada && (
              <div className="space-y-4">
                {aprovacaoMensagem && (
                  <div className="rounded-2xl bg-foreground/5 px-5 py-3 text-sm text-foreground shadow-sm">
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Resultado</p>
                    <p>{aprovacaoMensagem}</p>
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data da aprovação</label>
                    <Input
                      type="date"
                      value={aprovacaoData}
                      onChange={(e) => setAprovacaoData(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anexar e-mail</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".msg,.eml,.pdf"
                        ref={aprovacaoAttachmentInputRef}
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setAprovacaoAnexoName(file?.name ?? null);
                          if (e.target) e.target.value = "";
                        }}
                      />
                      <Button variant="outline" size="sm" onClick={triggerAprovacaoAttachmentUpload}>
                        Selecionar arquivo
                      </Button>
                      {aprovacaoAnexoName && (
                        <span className="text-xs text-muted-foreground">{aprovacaoAnexoName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comentários</label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2 min-h-[140px] text-sm"
                    value={aprovacaoComentarios}
                    onChange={(e) => setAprovacaoComentarios(e.target.value)}
                    placeholder="Relate ajustes, pendências ou justificativas."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalAprovacaoDetalheOpen(false)}>Fechar</Button>
                  <Button onClick={handleSalvarAprovacao}>Salvar aprovação</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={modalFaturamentoOpen} onOpenChange={setModalFaturamentoOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Faturamento</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Visualize obras prontas para emitir nota fiscal.</p>
            </DialogHeader>
            <div className="space-y-4 pb-4">
              {obrasEmFaturamento.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma obra pronta para faturamento.</div>
              ) : (
                obrasEmFaturamento.map((obra) => (
                  <Card
                    key={obra.obra}
                    className="rounded-2xl border border-primary/70 bg-white px-5 py-4 shadow-sm cursor-pointer"
                    onClick={() => handleSelectObraFaturamento(obra)}
                  >
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Obra pronta</div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold text-foreground">{obra.obra}</div>
                        <div className="text-sm text-muted-foreground">OS: {obra.os} · {obra.cidade}</div>
                      </div>
                      <Badge variant="secondary">{obra.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-wide text-primary">lote</span>
                      <span className="text-muted-foreground">Lote/NF pendente</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={modalFaturamentoDetalheOpen} onOpenChange={(open) => {
          if (!open) {
            setModalFaturamentoDetalheOpen(false);
            setObraFaturamentoSelecionada(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Faturamento · {obraFaturamentoSelecionada?.obra}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Registre nota fiscal, data e anexo da remessa.</p>
            </DialogHeader>
            {obraFaturamentoSelecionada && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota fiscal</label>
                    <Input
                      value={notaFiscal}
                      onChange={(e) => setNotaFiscal(e.target.value)}
                      placeholder="Digite o número da NF"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data do faturamento</label>
                    <Input
                      type="date"
                      value={dataFaturamento}
                      onChange={(e) => setDataFaturamento(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Número do lote</label>
                    <Input
                      value={numeroLoteFaturamento}
                      onChange={(e) => setNumeroLoteFaturamento(e.target.value)}
                      placeholder="Informe o número do lote"
                      disabled={obraFaturamentoSelecionada?.loteBloqueado}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data de geração do lote</label>
                    <Input
                      type="date"
                      value={dataLoteGeracao}
                      onChange={(e) => setDataLoteGeracao(e.target.value)}
                      disabled={obraFaturamentoSelecionada?.loteBloqueado}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Anexar e-mail</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".msg,.eml,.pdf"
                      ref={faturamentoAttachmentInputRef}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setFaturamentoAnexoName(file?.name ?? null);
                        if (e.target) e.target.value = "";
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={triggerFaturamentoAttachmentUpload}>
                      Selecionar arquivo
                    </Button>
                    {faturamentoAnexoName && (
                      <span className="text-xs text-muted-foreground">{faturamentoAnexoName}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</label>
                  <textarea
                    className="w-full border rounded-xl px-3 py-2 min-h-[120px] text-sm"
                    value={faturamentoComentarios}
                    onChange={(e) => setFaturamentoComentarios(e.target.value)}
                    placeholder="Registre pendências contábeis ou notas complementares."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalFaturamentoDetalheOpen(false)}>Fechar</Button>
                  <Button variant="ghost" onClick={handleSalvarLote} disabled={obraFaturamentoSelecionada?.loteBloqueado}>Salvar lote</Button>
                  <Button onClick={handleSalvarFaturamento}>Salvar faturamento</Button>
                </div>
              </div>
            )}
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

    </div>
  );
};

export default Obras;
