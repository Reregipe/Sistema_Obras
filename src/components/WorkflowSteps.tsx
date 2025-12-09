import { useEffect, useState, useCallback } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp, ArrowRight, Loader2, Plus, Save, FileDown } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";



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

    description: "Recebido e lista prévia de materiais para o almoxarifado",

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

    description: "Serviço em execução ou despachado",

    icon: Wrench,

    color: "text-green-600",

    bgColor: "bg-green-50",

    route: "/acionamentos",

    count: 0,

    status: "active",

  },

  {

    id: 3,

    title: "Medir serviços executados",

    description: "Valorizar MO, ajustar materiais e registrar horário (orçamento)",

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



const CLASSIFICACOES_SUCATA = ["sucata", "reforma", "bom", "descarte"];



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

  const [sucataClassificacao, setSucataClassificacao] = useState<string>(CLASSIFICACOES_SUCATA[0]);

  const [sucataSugestoes, setSucataSugestoes] = useState<any[]>([]);

  const [sucataMatEncontrado, setSucataMatEncontrado] = useState<any | null>(null);

  const [loadingSugestoesSucata, setLoadingSugestoesSucata] = useState(false);

  const [consumoCodigo, setConsumoCodigo] = useState("");

  const [consumoMatEncontrado, setConsumoMatEncontrado] = useState<any | null>(null);

  const [consumoQtd, setConsumoQtd] = useState<number>(1);

  const [consumoSugestoes, setConsumoSugestoes] = useState<any[]>([]);

  const [loadingSugestoesConsumo, setLoadingSugestoesConsumo] = useState(false);

  const [currentUserName, setCurrentUserName] = useState<string>("");

  const [encarregadoNome, setEncarregadoNome] = useState<string>("");

  const [encarregadoSelecionado, setEncarregadoSelecionado] = useState<string>("");

  const [almoxConferido, setAlmoxConferido] = useState<boolean>(false);

  const [execModalOpen, setExecModalOpen] = useState(false);

  const [execLoading, setExecLoading] = useState(false);

  const [execError, setExecError] = useState<string | null>(null);

  const [execInfo, setExecInfo] = useState<string | null>(null);

  const [execReadonly, setExecReadonly] = useState(false);

  // Etapa 3 - Medição / Orçamento (sem persistência)
  const [medicaoModalOpen, setMedicaoModalOpen] = useState(false);
  const [medicaoTab, setMedicaoTab] = useState<"LM" | "LV">("LM");
  const [medicaoCatalogo, setMedicaoCatalogo] = useState<any[]>([]);
  const [medicaoBusca, setMedicaoBusca] = useState("");
  const [medicaoForaHC, setMedicaoForaHC] = useState(false);
  const [medicaoAdicional, setMedicaoAdicional] = useState<number>(0);
  const [medicaoValorUpsLM, setMedicaoValorUpsLM] = useState<number>(119.62);
  const [medicaoValorUpsLV, setMedicaoValorUpsLV] = useState<number>(357.78);
  const [medicaoItens, setMedicaoItens] = useState<Record<"LM" | "LV", any[]>>({
    LM: [],
    LV: [],
  });

  const emptyExec = {

    km_inicial: "",

    km_final: "",

    km_total: "",

    saida_base: "",

    inicio_servico: "",

    retorno_servico: "",

    retorno_base: "",

    troca_transformador: false,

    trafo_ret_potencia: "",

    trafo_ret_marca: "",

    trafo_ret_ano: "",

    trafo_ret_tensao_secundaria: "",

    trafo_ret_tensao_primaria: "",

    trafo_ret_numero_serie: "",

    trafo_ret_patrimonio: "",

    trafo_inst_potencia: "",

    trafo_inst_marca: "",

    trafo_inst_ano: "",

    trafo_inst_tensao_secundaria: "",

    trafo_inst_tensao_primaria: "",

    trafo_inst_numero_serie: "",

    trafo_inst_patrimonio: "",

    tensao_an: "",

    tensao_bn: "",

    tensao_cn: "",

    tensao_ab: "",

    tensao_bc: "",

    tensao_ca: "",

    alimentador: "",

    subestacao: "",

    numero_transformador: "",

    id_poste: "",

    os_tablet: "",

    ss_nota: "",

    numero_intervencao: "",

    observacoes: "",

  };

  const [execForm, setExecForm] = useState<any>(emptyExec);

  const toInputDateTime = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    // datetime-local expects yyyy-MM-ddTHH:mm
    return d.toISOString().slice(0, 16);
  };

  // ---------- Medição / Orçamento (Etapa 3 - sem persistência) ----------
  const loadCatalogoMO = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("codigos_mao_de_obra")
        .select("codigo_mao_de_obra,descricao,unidade,ups,tipo,operacao,ativo")
        .order("codigo_mao_de_obra");
      const ativos = (data || []).filter((m: any) => (m.ativo || "S") !== "N");
      setMedicaoCatalogo(ativos as any[]);
    } catch {
      // falha silenciosa para não travar o modal
      setMedicaoCatalogo([]);
    }
  }, []);

  const openMedicaoModal = async (item: any) => {
    setSelectedItem(item);
    const mod = (item.modalidade || "LM").toUpperCase();
    const initialTab: "LM" | "LV" = mod === "LM+LV" ? "LM" : (mod as "LM" | "LV");
    setMedicaoTab(initialTab);
    setMedicaoModalOpen(true);
    
    // Carrega valores UPS em reais das configurações
    try {
      const { data: configs } = await supabase
        .from("system_settings")
        .select("chave, valor")
        .in("chave", ["ups_valor_lm", "ups_valor_lv"]);
      if (configs) {
        const lmConfig = configs.find((c) => c.chave === "ups_valor_lm");
        const lvConfig = configs.find((c) => c.chave === "ups_valor_lv");
        if (lmConfig) setMedicaoValorUpsLM(Number(lmConfig.valor) || 119.62);
        if (lvConfig) setMedicaoValorUpsLV(Number(lvConfig.valor) || 357.78);
      }
    } catch {
      // Usa valores padrão em caso de erro
    }
    
    // Carrega consumo e sucata para incluir no PDF
    try {
      const { data: consumoList } = await supabase
        .from("lista_aplicacao_itens")
        .select("id_lista_aplicacao_item,codigo_material,descricao_item,unidade_medida,quantidade,id_acionamento")
        .eq("id_acionamento", item.id_acionamento)
        .order("ordem_item");
      
      if (consumoList && consumoList.length > 0) {
        setConsumo(
          consumoList.map((c) => ({
            id: c.id_lista_aplicacao_item,
            codigo_material: c.codigo_material,
            descricao_item: c.descricao_item || "",
            unidade_medida: c.unidade_medida || "",
            quantidade: Number(c.quantidade || 0),
          }))
        );
      } else {
        setConsumo([]);
      }
      
      const { data: sucataList } = await supabase
        .from("sucata_itens")
        .select("id,codigo_material,quantidade_retirada,criado_em,classificacao")
        .eq("id_acionamento", item.id_acionamento)
        .order("criado_em", { ascending: false });
      
      if (sucataList && sucataList.length > 0) {
        const enrichedSucata = await enrichMateriais(
          sucataList.map((s) => ({
            id: s.id,
            codigo_material: s.codigo_material,
            quantidade: Number(s.quantidade_retirada || 0),
            classificacao: s.classificacao || "",
          }))
        );
        setSucata(enrichedSucata);
      } else {
        setSucata([]);
      }
    } catch {
      // Se falhar, continua sem materiais no PDF
      setConsumo([]);
      setSucata([]);
    }
    
    await loadCatalogoMO();
  };

  const handleAddMedicaoItem = (mo: any) => {
    const codigo = mo.codigo_mao_de_obra;
    const operacao = mo.operacao || "";
    
    // Verifica duplicata por código + operação
    const jaExiste = medicaoItens[medicaoTab]?.some(
      (i: any) => i.codigo === codigo && i.operacao === operacao
    );
    
    if (jaExiste) {
      setMaterialError(`Código ${codigo} (${operacao}) já foi adicionado à medição.`);
      return;
    }
    
    const upsValue = Number(mo.ups) || 0;
    const novo = {
      codigo,
      operacao,
      descricao: mo.descricao || "",
      unidade: mo.unidade || mo.tipo || "",
      fracao: upsValue,
      valorUps: upsValue,
      quantidade: 1,
    };
    setMedicaoItens((prev) => ({
      ...prev,
      [medicaoTab]: [...prev[medicaoTab], novo],
    }));
    setMaterialError(null);
  };

  const handleQtdMedicao = (codigo: string, operacao: string, qtd: number) => {
    setMedicaoItens((prev) => ({
      ...prev,
      [medicaoTab]: prev[medicaoTab].map((i) =>
        i.codigo === codigo && i.operacao === operacao ? { ...i, quantidade: qtd } : i
      ),
    }));
  };

  const handleFracaoMedicao = (codigo: string, operacao: string, fr: number) => {
    setMedicaoItens((prev) => ({
      ...prev,
      [medicaoTab]: prev[medicaoTab].map((i) =>
        i.codigo === codigo && i.operacao === operacao ? { ...i, fracao: fr } : i
      ),
    }));
  };

  const handleRemoveMedicao = (codigo: string, operacao: string) => {
    setMedicaoItens((prev) => ({
      ...prev,
      [medicaoTab]: prev[medicaoTab].filter((i) => !(i.codigo === codigo && i.operacao === operacao)),
    }));
  };

  const subtotalMedicao = (i: any) => {
    const valorUpsConfig = medicaoTab === "LM" ? medicaoValorUpsLM : medicaoValorUpsLV;
    const base = (Number(i.quantidade) || 0) * (Number(i.valorUps) || 0) * valorUpsConfig;
    // Aplica adicional em todos os itens
    if (medicaoForaHC) {
      return base * 1.30; // +30% fora HC
    }
    // Horário comercial: +12%
    return base * 1.12;
  };

  const totalAbaMedicao = (tabKey: "LM" | "LV") => {
    const soma = (medicaoItens[tabKey] || []).reduce((acc, i) => acc + subtotalMedicao(i), 0);
    return medicaoForaHC ? soma * (1 + (medicaoAdicional || 0) / 100) : soma;
  };

  const materiaisReferencia = consumo || [];

  const gerarOrcamento = async () => {
    if (!selectedItem) return;
    
    // Busca dados de execução para incluir informações de transformador
    let dadosExec: any = null;
    try {
      const { data } = await supabase
        .from("acionamento_execucao")
        .select("*")
        .eq("id_acionamento", selectedItem.id_acionamento)
        .maybeSingle();
      dadosExec = data;
    } catch {
      // Se não houver dados, continua sem
    }
    
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const orangeColor = [255, 200, 150]; // Cor laranja clara #FFC896
    
    // ==================== CABEÇALHO ====================
    // Fundo laranja
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(0, 0, pageWidth, 35, "F");
    
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    
    // Linha 1: Labels
    doc.setFontSize(7);
    doc.text("EQUIPE/S:", 10, 8);
    doc.text("ACIONAMENTO:", 70, 8);
    doc.text("CÓDIGO CLIENTE:", 130, 8);
    doc.text("DATA MEDIÇÃO:", 180, 8);
    doc.text("SERVIÇO:", 230, 8);
    
    // Linha 1: Valores
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(encarregadoNome || selectedItem.encarregado || "", 10, 12);
    doc.text(selectedItem.codigo_acionamento || "", 70, 12);
    doc.text("", 130, 12); // código cliente vazio
    doc.text(formatDateBr(selectedItem.data_abertura), 180, 12);
    doc.text(selectedItem.tipo_servico || "", 230, 12);
    
    // Linha 2: Endereço da obra
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("OBRA NOME =>", 10, 18);
    doc.setFont("helvetica", "normal");
    doc.text(selectedItem.endereco || "", 35, 18);
    
    // Linha 3: Retorno base e início
    doc.setFont("helvetica", "bold");
    doc.text("RETORNO BASE =>", 10, 23);
    doc.text("INÍCIO DA OBRA =>", 10, 28);
    doc.setFont("helvetica", "normal");
    const retornoBase = dadosExec?.retorno_base ? formatDateBr(dadosExec.retorno_base) : "";
    const inicioObra = dadosExec?.inicio_servico ? formatDateBr(dadosExec.inicio_servico) : formatDateBr(selectedItem.data_abertura);
    doc.text(retornoBase, 40, 23);
    doc.text(inicioObra, 40, 28);
    
    // Coluna direita do cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("DATA DE RETORNO:", 180, 23);
    doc.text("SITUAÇÃO:", 180, 28);
    doc.text("TÉCNICO BASE:", 180, 33);
    doc.text("HORÁRIO:", 230, 33);
    
    doc.setFont("helvetica", "normal");
    const dataRetorno = dadosExec?.retorno_servico ? formatDateBr(dadosExec.retorno_servico) : "";
    doc.text(dataRetorno, 215, 23);
    doc.text(selectedItem.status || "", 205, 28);
    doc.text("", 210, 33); // vazio
    doc.text(medicaoForaHC ? "FORA HC" : "HORÁRIO COMERCIAL", 245, 33);
    
    // NR grande no canto direito
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NR", pageWidth - 25, 12);
    doc.setFontSize(14);
    doc.text(selectedItem.numero_os || "400", pageWidth - 25, 20);
    doc.setFontSize(12);
    doc.text(selectedItem.modalidade || "EM", pageWidth - 25, 27);
    
    let yPos = 40;
    
    // ==================== MÃO DE OBRA ====================
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(0, yPos, pageWidth, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`MÃO DE OBRA - ${medicaoTab}`, 10, yPos + 5);
    yPos += 7;

    const itensMO = medicaoItens[medicaoTab] || [];
    if (itensMO.length > 0) {
      const bodyMO = itensMO.map((item, idx) => {
        const valorUni = (Number(item.valorUps) || 0) * (medicaoTab === "LM" ? medicaoValorUpsLM : medicaoValorUpsLV);
        const subtotal = subtotalMedicao(item);
        return [
          idx + 1,
          item.codigo,
          item.operacao || "",
          item.descricao,
          item.unidade,
          Number(item.quantidade).toFixed(2),
          Number(item.valorUps || 0).toFixed(3),
          `R$ ${valorUni.toFixed(2)}`,
          `R$ ${subtotal.toFixed(2)}`
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [["ITEM", "CÓDIGO", "OPERAÇÃO", "DESCRIÇÃO", "UN", "QUANT", "UPS", "VALOR UNI", "TOTAL"]],
        body: bodyMO,
        styles: { 
          fontSize: 7, 
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: orangeColor, 
          textColor: 0, 
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 18, halign: "center" },
          2: { cellWidth: 18, halign: "center" },
          3: { cellWidth: 95, halign: "left" },
          4: { cellWidth: 12, halign: "center" },
          5: { cellWidth: 18, halign: "center" },
          6: { cellWidth: 18, halign: "center" },
          7: { cellWidth: 23, halign: "right" },
          8: { cellWidth: 25, halign: "right" }
        },
        theme: "grid",
      });
      yPos = (doc as any).lastAutoTable.finalY + 3;
    }

    // Total MO com fundo laranja
    const totalMO = totalAbaMedicao(medicaoTab);
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(pageWidth - 60, yPos, 55, 7, "F");
    doc.setDrawColor(0);
    doc.rect(pageWidth - 60, yPos, 55, 7, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`TOTAL MÃO DE OBRA: R$ ${totalMO.toFixed(2)}`, pageWidth - 57, yPos + 5);
    yPos += 10;

    // ==================== TRANSFORMADOR ====================
    // Só inclui se houver dados de transformador
    const temTrafoInst = dadosExec?.trafo_inst_potencia || dadosExec?.trafo_inst_marca || dadosExec?.trafo_inst_ano || dadosExec?.trafo_inst_numero_serie;
    const temTrafoRet = dadosExec?.trafo_ret_potencia || dadosExec?.trafo_ret_marca || dadosExec?.trafo_ret_ano || dadosExec?.trafo_ret_numero_serie;
    
    if (temTrafoInst || temTrafoRet) {
      doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.rect(0, yPos, pageWidth / 2 - 2, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TRANSFORMADOR INSTALADO - POTÊNCIA:", 10, yPos + 5);
      
      doc.rect(pageWidth / 2 + 2, yPos, pageWidth / 2 - 2, 7, "F");
      doc.text("TRANSFORMADOR RETIRADO:", pageWidth / 2 + 10, yPos + 5);
      yPos += 7;
      
      // Dados dos transformadores (da etapa de execução)
      doc.setDrawColor(0);
      doc.rect(0, yPos, pageWidth / 2 - 2, 20, "S");
      doc.rect(pageWidth / 2 + 2, yPos, pageWidth / 2 - 2, 20, "S");
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      
      // Transformador Instalado
      if (temTrafoInst) {
        let yInst = yPos + 4;
        doc.text(`Potência: ${dadosExec.trafo_inst_potencia || ""}`, 10, yInst);
        doc.text(`Marca: ${dadosExec.trafo_inst_marca || ""}`, 10, yInst + 4);
        doc.text(`Ano: ${dadosExec.trafo_inst_ano || ""}`, 10, yInst + 8);
        doc.text(`Nº Série: ${dadosExec.trafo_inst_numero_serie || ""}`, 10, yInst + 12);
      }
      
      // Transformador Retirado
      if (temTrafoRet) {
        let yRet = yPos + 4;
        doc.text(`Potência: ${dadosExec.trafo_ret_potencia || ""}`, pageWidth / 2 + 10, yRet);
        doc.text(`Marca: ${dadosExec.trafo_ret_marca || ""}`, pageWidth / 2 + 10, yRet + 4);
        doc.text(`Ano: ${dadosExec.trafo_ret_ano || ""}`, pageWidth / 2 + 10, yRet + 8);
        doc.text(`Nº Série: ${dadosExec.trafo_ret_numero_serie || ""}`, pageWidth / 2 + 10, yRet + 12);
      }
      
      yPos += 22;
    }

    // ==================== MATERIAL APLICADO ====================
    if (consumo.length > 0) {
      doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.rect(0, yPos, pageWidth, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("MATERIAL APLICADO", 10, yPos + 5);
      yPos += 7;

      const bodyConsumo = consumo.map((c, idx) => [
        idx + 1,
        c.codigo_material,
        c.descricao_item || "",
        c.unidade_medida || "",
        Number(c.quantidade).toFixed(2)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["ITEM", "CÓDIGO", "DESCRIÇÃO", "UN", "QUANT"]],
        body: bodyConsumo,
        styles: { 
          fontSize: 7, 
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: orangeColor, 
          textColor: 0, 
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 150, halign: "left" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 20, halign: "center" }
        },
        theme: "grid",
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // ==================== MATERIAL RETIRADO (SUCATA) ====================
    if (sucata.length > 0) {
      if (yPos > pageHeight - 70) {
        doc.addPage("landscape");
        yPos = 15;
      }
      
      doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
      doc.rect(0, yPos, pageWidth, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("MATERIAL RETIRADO (SUCATA)", 10, yPos + 5);
      yPos += 7;

      const bodySucata = sucata.map((s, idx) => [
        idx + 1,
        s.codigo_material,
        s.descricao_item || "",
        s.unidade_medida || "",
        Number(s.quantidade).toFixed(2),
        s.classificacao || ""
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["ITEM", "CÓDIGO", "DESCRIÇÃO", "UN", "QUANT", "CLASSIFICAÇÃO"]],
        body: bodySucata,
        styles: { 
          fontSize: 7, 
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: { 
          fillColor: orangeColor, 
          textColor: 0, 
          fontStyle: "bold",
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 120, halign: "left" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 30, halign: "center" }
        },
        theme: "grid",
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // ==================== ASSINATURAS ====================
    if (yPos > pageHeight - 45) {
      doc.addPage("landscape");
      yPos = 15;
    }
    
    yPos = pageHeight - 40;
    
    const colWidth = pageWidth / 3 - 5;
    
    // Líder equipe
    doc.setDrawColor(0);
    doc.line(10, yPos + 15, 10 + colWidth, yPos + 15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("LÍDER DE EQUIPE", 10 + colWidth / 2, yPos + 20, { align: "center" });
    
    // Fiscal
    doc.line(10 + colWidth + 5, yPos + 15, 10 + 2 * colWidth + 5, yPos + 15);
    doc.text("FISCAL", 10 + 1.5 * colWidth + 5, yPos + 20, { align: "center" });
    
    // Cliente
    doc.line(10 + 2 * colWidth + 10, yPos + 15, 10 + 3 * colWidth + 10, yPos + 15);
    doc.text("CLIENTE / RESPONSÁVEL", 10 + 2.5 * colWidth + 10, yPos + 20, { align: "center" });

    // ==================== RODAPÉ ====================
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const rodape = `Orçamento gerado em ${new Date().toLocaleString("pt-BR")} | Tipo: ${medicaoTab} | ${medicaoForaHC ? "Fora de Horário Comercial (+30%)" : "Horário Comercial (+12%)"}`;
    doc.text(rodape, pageWidth / 2, pageHeight - 5, { align: "center" });

    doc.save(`Orcamento_${selectedItem.codigo_acionamento || "acionamento"}_${medicaoTab}.pdf`);
    setMaterialInfo("Orçamento gerado com sucesso.");
  };



  const makeId = () => {

    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  };



  const getUserDisplayName = (user: any) => {

    const meta = (user?.user_metadata as any) || {};

    return (

      meta.full_name ||

      meta.name ||

      meta.nome ||

      meta.display_name ||

      meta.preferred_username ||

      ""

    );

  };



  const resolveEncarregadoNome = (data: any) => {

    if (!data) return "";

    const nomesBrutos =

      data.encarregado_nome ||

      data.encarregado ||

      data.encarregado_equipe ||

      data.responsavel_nome ||

      data.responsavel ||

      data.equipe_nome ||

      "";

    return nomesBrutos;

  };



  const splitEncarregados = (nomes: string) => {

    return (nomes || "")

      .split(/[/,;]+/)

      .map((n) => n.trim())

      .filter(Boolean);

  };



  const uniqueEncarregados = (nomes: string) => {

    return Array.from(new Set(splitEncarregados(nomes)));

  };



  const shouldAdvanceEtapa1 = (item: any, preCount: number, almoxFlag: boolean) => {

    if (!item) return false;

    if (!selectedStep || selectedStep.id !== 1) return false;

    const statusDesp = (item.status || "").toLowerCase().includes("despach");

    return preCount > 0 && statusDesp && item.data_despacho && almoxFlag;

  };



  const attemptAutoAdvanceEtapa1 = async (item: any, preCount: number, almoxFlag: boolean) => {

    if (!shouldAdvanceEtapa1(item, preCount, almoxFlag)) return;

    try {

      const payload: any = { etapa_atual: 2 };

      if (!almoxFlag) {

        payload.almox_conferido_em = new Date().toISOString();

      }

      const { error } = await supabase

        .from("acionamentos")

        .update(payload)

        .eq("id_acionamento", item.id_acionamento);

      if (error) throw error;

      setSelectedItem((prev: any) =>

        prev

          ? {

              ...prev,

              ...payload,

            }

          : prev

      );

      setMaterialInfo("Avanado automaticamente para a Etapa 2.");

    } catch (err: any) {

      setMaterialError(err.message || "Erro ao avanar etapa.");

    }

  };



  useEffect(() => {

    if (open && selectedStep) {

      loadItems(selectedStep);

    }

  }, [open, selectedStep]);



  useEffect(() => {

    const loadUser = async () => {

      const { data } = await supabase.auth.getUser();

      const user = data?.user;

      const name = getUserDisplayName(user) || "";

      setCurrentUserName(name);

    };

    loadUser();

  }, []);



  useEffect(() => {

    const encRaw = encarregadoNome || selectedItem?.encarregado || "";

    const lista = uniqueEncarregados(encRaw);

    if (lista.length === 1) {

      setEncarregadoSelecionado(lista[0]);

    }

  }, [encarregadoNome, selectedItem]);



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

          "id_acionamento,codigo_acionamento,numero_os,status,prioridade,municipio,modalidade,data_abertura,data_despacho,etapa_atual,encarregado,almox_conferido_em"

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



  const enrichPreLista = async (lista: any[]) => {

    let enriched = lista || [];

    if (enriched.length === 0) return enriched;

    const codigos = enriched.map((p: any) => p.codigo_material).filter(Boolean);

    const { data: mats } = await supabase

      .from("materiais")

      .select("codigo_material,descricao,unidade_medida")

      .in("codigo_material", codigos);

    const matMap = new Map((mats || []).map((m: any) => [m.codigo_material, m]));

    return enriched.map((p: any) => {

      const found = matMap.get(p.codigo_material) || {};

      return {

        ...p,

        descricao_item: p.descricao_item || found.descricao || "",

        unidade_medida: p.unidade_medida || found.unidade_medida || "",

      };

    });

  };



  const enrichMateriais = async (lista: any[]) => {

    if (!lista || lista.length === 0) return [];

    const codigos = Array.from(new Set(lista.map((p: any) => p.codigo_material).filter(Boolean)));

    if (codigos.length === 0) return lista;

    const { data: mats } = await supabase

      .from("materiais")

      .select("codigo_material,descricao,unidade_medida")

      .in("codigo_material", codigos);

    const matMap = new Map((mats || []).map((m: any) => [m.codigo_material, m]));

    return (lista || []).map((p: any) => {

      const found = matMap.get(p.codigo_material) || {};

      return {

        ...p,

        descricao_item: p.descricao_item || found.descricao || "",

        unidade_medida: p.unidade_medida || found.unidade_medida || "",

        descricao: p.descricao || found.descricao || "",

      };

    });

  };



  useEffect(() => {

    const handler = setTimeout(async () => {

      const term = preCodigo.trim();

      if (!term || term.length < 2) {

        setPreSugestoes([]);

        return;

      }

      setLoadingSugestoesPre(true);

      const data = await searchMaterial(term);

      setPreSugestoes(data || []);

      setLoadingSugestoesPre(false);

    }, 300);

    return () => clearTimeout(handler);

  }, [preCodigo]);



  useEffect(() => {

    const handler = setTimeout(async () => {

      const term = consumoCodigo.trim();

      if (!term || term.length < 2) {

        setConsumoSugestoes([]);

        return;

      }

      setLoadingSugestoesConsumo(true);

      const data = await searchMaterial(term);

      setConsumoSugestoes(data || []);

      setLoadingSugestoesConsumo(false);

    }, 300);

    return () => clearTimeout(handler);

  }, [consumoCodigo]);



  useEffect(() => {

    const handler = setTimeout(async () => {

      const term = sucataCodigo.trim();

      if (!term || term.length < 2) {

        setSucataSugestoes([]);

        return;

      }

      setLoadingSugestoesSucata(true);

      const data = await searchMaterial(term);

      setSucataSugestoes(data || []);

      setLoadingSugestoesSucata(false);

    }, 300);

    return () => clearTimeout(handler);

  }, [sucataCodigo]);



  useEffect(() => {

    const encRaw = encarregadoNome || selectedItem?.encarregado || "";

    const lista = uniqueEncarregados(encRaw);

    if (lista.length === 1) {

      setEncarregadoSelecionado(lista[0]);

    }

  }, [encarregadoNome, selectedItem]);



  const handleToggleAlmox = async (checked: boolean) => {

    if (!selectedItem) return;

    setMaterialError(null);

    setMaterialInfo(null);

    try {

      const podeAvancarEtapa1 =

        checked &&

        selectedStep?.id === 1 &&

        preLista.length > 0 &&

        selectedItem.status?.toLowerCase().includes("despach") &&

        selectedItem.data_despacho;



      const payload: any = {

        almox_conferido_em: checked ? new Date().toISOString() : null,

        ...(podeAvancarEtapa1 ? { etapa_atual: 2 } : {}),

      };

      const { error } = await supabase

        .from("acionamentos")

        .update(payload)

        .eq("id_acionamento", selectedItem.id_acionamento);

      if (error) throw error;

      setAlmoxConferido(checked);

      if (podeAvancarEtapa1) {

        setMaterialInfo("Conferido pelo almox e avanado para Etapa 2.");

        setSelectedStep((prev) => (prev && prev.id === 1 ? { ...prev, id: 2 } : prev));

        setSelectedItem((prev: any) =>

          prev

            ? {

                ...prev,

                almox_conferido_em: payload.almox_conferido_em,

                etapa_atual: 2,

              }

            : prev

        );

      } else {

        setMaterialInfo(checked ? "Conferido pelo almox." : "Marcao removida.");

        setSelectedItem((prev: any) =>

          prev

            ? {

                ...prev,

                almox_conferido_em: payload.almox_conferido_em,

              }

            : prev

        );

      }

    } catch (err: any) {

      setMaterialError(err.message || "Erro ao marcar conferncia do almox.");

    }

  };



  const openExecModal = async (item: any) => {

    setSelectedItem(item);

    setExecModalOpen(true);

    setExecLoading(true);

    setExecError(null);

    setExecInfo(null);

    setExecReadonly(!!selectedStep && selectedStep.id >= 3);

    setExecForm(emptyExec);

    try {

      const { data } = await supabase
        .from("acionamento_execucao")
        .select("*")
        .eq("id_acionamento", item.id_acionamento)
        .maybeSingle();

      if (data) {

        setExecForm({

          ...emptyExec,

          ...data,

          km_inicial: data.km_inicial ?? "",

          km_final: data.km_final ?? "",

          km_total: data.km_total ?? "",

          saida_base: toInputDateTime(data.saida_base),

          inicio_servico: toInputDateTime(data.inicio_servico),

          retorno_servico: toInputDateTime(data.retorno_servico),

          retorno_base: toInputDateTime(data.retorno_base),

        });

      }

    } catch (err: any) {

      setExecError(err.message || "Erro ao carregar dados da execução.");

    } finally {

      setExecLoading(false);

    }

  };



  const handleExecChange = (field: string, value: any) => {

    setExecForm((prev: any) => {

      const next = { ...prev, [field]: value };

      if (field === "km_inicial" || field === "km_final") {

        const ini = Number(field === "km_inicial" ? value : next.km_inicial);

        const fin = Number(field === "km_final" ? value : next.km_final);

        if (!isNaN(ini) && !isNaN(fin)) {

          next.km_total = fin - ini;

        }

      }

      return next;

    });

  };



  const validateExecForm = () => {

    const f = execForm || {};

    const requiredBase = [

      "km_inicial",

      "km_final",

      "saida_base",

      "inicio_servico",

      "retorno_servico",

      "retorno_base",

      "alimentador",
      "subestacao",
      "numero_transformador",
      "id_poste",
    ];

    for (const key of requiredBase) {

      if (!f[key] && f[key] !== 0) {

        return "Preencha todos os campos obrigatórios da execução.";

      }

    }

    if (f.troca_transformador) {

      const trafoFields = [

        "trafo_ret_potencia",

        "trafo_ret_marca",

        "trafo_ret_ano",

        "trafo_ret_tensao_secundaria",

        "trafo_ret_tensao_primaria",

        "trafo_ret_numero_serie",

        "trafo_ret_patrimonio",

        "trafo_inst_potencia",

        "trafo_inst_marca",

        "trafo_inst_ano",

        "trafo_inst_tensao_secundaria",

        "trafo_inst_tensao_primaria",

        "trafo_inst_numero_serie",

        "trafo_inst_patrimonio",

        "tensao_an",

        "tensao_bn",

        "tensao_cn",

        "tensao_ab",

        "tensao_bc",

        "tensao_ca",

      ];

      for (const key of trafoFields) {

        if (!f[key] && f[key] !== 0) {

          return "Preencha todos os dados do transformador e tenses.";

        }

      }

    }

    return null;

  };



  const saveExec = async () => {

    if (!selectedItem) return;

    setExecLoading(true);

    setExecError(null);

    setExecInfo(null);

    const validation = validateExecForm();

    if (validation) {

      setExecError(validation);

      setExecLoading(false);

      return;

    }

    try {

      const payload = {
        ...execForm,
        os_tablet: execForm.os_tablet || null,
        ss_nota: execForm.ss_nota || null,
        numero_intervencao: execForm.numero_intervencao || null,
        observacoes: execForm.observacoes || null,
        id_acionamento: selectedItem.id_acionamento,
      };

      await supabase.from("acionamento_execucao").upsert(payload, { onConflict: "id_acionamento" });

      await supabase

        .from("acionamentos")

        .update({ 

          etapa_atual: 3,

          execucao_finalizada_em: new Date().toISOString(),

          status: "concluido"

        })

        .eq("id_acionamento", selectedItem.id_acionamento);

      // Atualiza item local para refletir mudanças
      if (selectedItem) {
        selectedItem.status = "concluido";
        selectedItem.etapa_atual = 3;
      }

      setExecInfo("Dados da execução salvos e etapa liberada.");

      setExecReadonly(true);

    } catch (err: any) {

      setExecError(err.message || "Erro ao salvar dados da execução.");

    } finally {

      setExecLoading(false);

    }

  };



  const openMaterialsModal = async (item: any) => {

    setMaterialsOpen(true);

    setMaterialsLoading(true);

    setMaterialError(null);

    setMaterialInfo(null);

    setPreLista([]);

    setConsumo([]);

    setSucata([]);

    setEncarregadoNome("");

    setAlmoxConferido(false);

    setExecModalOpen(false);

    // Na Etapa 2, se ainda estiver como "despachado", ajusta para "em_execucao"
    if (selectedStep?.id === 2 && (item.status || "").toLowerCase().includes("despach")) {
      try {
        await supabase
          .from("acionamentos")
          .update({ status: "em_execucao" })
          .eq("id_acionamento", item.id_acionamento);
        setSelectedItem((prev: any) =>
          prev
            ? {
                ...prev,
                status: "em_execucao",
              }
            : prev
        );
        item.status = "em_execucao";
      } catch {
        // não bloqueia o fluxo se falhar
      }
    }

    try {

      const { data: pre } = await supabase

        .from("pre_lista_itens")

        .select("id,codigo_material,quantidade_prevista,criado_em")

        .eq("id_acionamento", item.id_acionamento)

        .order("criado_em", { ascending: false });



      const enrichedPre = await enrichPreLista(pre || []);

      setPreLista(enrichedPre);



      try {

        const { data: extra } = await supabase

          .from("acionamentos")

          .select("encarregado, almox_conferido_em, data_despacho, status, etapa_atual")

          .eq("id_acionamento", item.id_acionamento)

          .single();



        const { data: encEqp } = await supabase

          .from("acionamento_equipes")

          .select("encarregado_nome")

          .eq("id_acionamento", item.id_acionamento);



        const nomes = [

          resolveEncarregadoNome(extra),

          resolveEncarregadoNome(item),

          ...(encEqp || []).map((e: any) => e.encarregado_nome || ""),

        ].filter(Boolean);



        const lista = uniqueEncarregados(nomes.join(" / "));

        const nomeEncBruto = lista.join(" / ");

        setEncarregadoNome(nomeEncBruto);

        setEncarregadoSelecionado(lista.length === 1 ? lista[0] : "");

        setAlmoxConferido(!!extra?.almox_conferido_em);

        await attemptAutoAdvanceEtapa1(

          { ...item, ...extra },

          enrichedPre.length,

          !!extra?.almox_conferido_em

        );

      } catch {

        const nomeEncBruto = resolveEncarregadoNome(item);

        const lista = uniqueEncarregados(nomeEncBruto);

        setEncarregadoNome(lista.join(" / "));

        setEncarregadoSelecionado(lista.length === 1 ? lista[0] : "");

        setAlmoxConferido(false);

      }



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



        // Se não houver consumo salvo, usa a pré-lista como base

        if ((consumoList || []).length === 0 && enrichedPre.length > 0) {

          setConsumo(

            enrichedPre.map((p) => ({

              codigo_material: p.codigo_material,

              descricao_item: p.descricao_item || "",

              unidade_medida: p.unidade_medida || "",

              quantidade: Number(p.quantidade_prevista || 0),

            }))

          );

        }



        const { data: sucataList } = await supabase

          .from("sucata_itens")

          .select("id,codigo_material,quantidade_retirada,criado_em,classificacao")

          .eq("id_acionamento", item.id_acionamento)

          .order("criado_em", { ascending: false });

        const enrichedSucata = await enrichMateriais(

          (sucataList || []).map((s) => ({

            id: s.id,

            codigo_material: s.codigo_material,

            quantidade: Number(s.quantidade_retirada || 0),

            classificacao: s.classificacao || "",

          }))

        );

        setSucata(enrichedSucata);

      }

    } catch (err: any) {

      setMaterialError(err.message || "Erro ao carregar listas.");

    } finally {

      setMaterialsLoading(false);

    }

  };



  const handleAddPreItem = () => {

    if (!preMatEncontrado) {

      setMaterialError("Busque um material válido antes de adicionar.");

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

            ? {

                ...p,

                quantidade_prevista: Number(p.quantidade_prevista || 0) + preQtd,

                descricao_item: p.descricao_item || preMatEncontrado.descricao || "",

                unidade_medida: p.unidade_medida || preMatEncontrado.unidade_medida || "",

              }

            : p

        )

      );

    } else {

      setPreLista((prev) => [

        ...prev,

        {

          id: makeId(),

          codigo_material: preMatEncontrado.codigo_material,

          descricao_item: preMatEncontrado.descricao || "",

          unidade_medida: preMatEncontrado.unidade_medida || "",

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



  const handleSelectPreSugestao = (mat: any) => {

    setPreMatEncontrado(mat);

    setPreCodigo(mat.codigo_material);

    setPreSugestoes([]);

  };



  const handleSelectConsumoSugestao = (mat: any) => {

    setConsumoMatEncontrado(mat);

    setConsumoCodigo(mat.codigo_material);

    setConsumoSugestoes([]);

  };



  const handleSelectSucataSugestao = (mat: any) => {

    setSucataMatEncontrado(mat);

    setSucataCodigo(mat.codigo_material);

    setSucataSugestoes([]);

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

      // Atualiza carimbo de validação da pré-lista e status

      await supabase

        .from("acionamentos")

        .update({ 
          pre_lista_validada_em: new Date().toISOString(),
          status: "despachado"
        })

        .eq("id_acionamento", selectedItem.id_acionamento);

      const { data: preReload, error: preReloadError } = await supabase

        .from("pre_lista_itens")

        .select("id,codigo_material,quantidade_prevista,criado_em")

        .eq("id_acionamento", selectedItem.id_acionamento)

        .order("criado_em", { ascending: false });

      if (preReloadError) throw preReloadError;

      const enriched = await enrichPreLista(preReload || []);

      setPreLista(enriched);

      // Atualiza item local para refletir mudanças
      if (selectedItem) {
        selectedItem.status = "despachado";
      }

      setMaterialInfo("Pre-lista salva.");

    } catch (err: any) {

      setMaterialError(err.message || "Erro ao Salvar pre-lista.");

    } finally {

      setSavingPre(false);

    }

  };



  const exportPreListaPdf = () => {

    if (!selectedItem) return;

    if (preLista.length === 0) {

      setMaterialError("Nenhum item na pre-lista para gerar PDF.");

      return;

    }



    const encBaseTodos = uniqueEncarregados(

      encarregadoNome || selectedItem?.encarregado || ""

    );

    const precisaEscolher = encBaseTodos.length > 1 && !encarregadoSelecionado;

    if (precisaEscolher) {

      setMaterialError("Selecione um encarregado antes de gerar o PDF.");

      return;

    }



    const doc = new jsPDF();

    const width = doc.internal.pageSize.getWidth();

    const titulo = `Acionamento ${selectedItem.codigo_acionamento || selectedItem.id_acionamento || "--"} - ${

      selectedItem.municipio || "--"

    } - ${getDataTitulo()}`;



    doc.setFont("helvetica", "bold");

    doc.setFontSize(13);

    doc.setTextColor(40);

    doc.text(titulo, width / 2, 16, { align: "center" });

    doc.setTextColor(0);



    autoTable(doc, {

      startY: 24,

      head: [["Codigo", "Descricao", "Unidade", "Quantidade"]],

      body: preLista.map((p) => [

        p.codigo_material,

        p.descricao_item || "",

        p.unidade_medida || "",

        p.quantidade_prevista,

      ]),

      styles: { fontSize: 10 },

      headStyles: { fillColor: [220, 53, 69], textColor: 255 },

      alternateRowStyles: { fillColor: [245, 245, 245] },

      theme: "striped",

    });



    const finalY = (doc as any).lastAutoTable?.finalY || 24;



    // Lista de encarregados em formato selecionvel

    const encarregadoRaw = encarregadoSelecionado || encarregadoNome || selectedItem?.encarregado || "";

    const encarregadoAss = (uniqueEncarregados(encarregadoRaw)[0]) || "________________";



    // Assinaturas lado a lado

    const lineY = finalY + 28;

    const labelY = lineY + 5;

    const lineWidth = (width - 60) / 2;



    const printedBy = currentUserName || "________________";



    // Assinatura de quem imprimiu

    doc.setLineWidth(0.2);

    doc.line(30, lineY, 30 + lineWidth, lineY);

    doc.setFontSize(9);

    doc.text(printedBy, 30 + lineWidth / 2, labelY, { align: "center" });



    // Assinatura do encarregado

    const rightStart = width - 30 - lineWidth;

    doc.line(rightStart, lineY, rightStart + lineWidth, lineY);

    doc.text(encarregadoAss, rightStart + lineWidth / 2, labelY, { align: "center" });



    const fileName = `pre-lista-${selectedItem.codigo_acionamento || selectedItem.id_acionamento || "acionamento"}.pdf`;

    doc.save(fileName);

  };



  const handleUpdatePreQuantidade = (codigo: string, valor: number) => {

    setPreLista((prev) =>

      prev.map((p) =>

        p.codigo_material === codigo

          ? { ...p, quantidade_prevista: valor >= 0 ? valor : 0 }

          : p

      )

    );

  };



  const handleAddConsumoItem = () => {

    if (!consumoMatEncontrado) {

      setMaterialError("Selecione um material para consumo.");

      return;

    }

    if (!consumoQtd || consumoQtd < 0) {

      setMaterialError("Informe quantidade vlida para consumo.");

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



  const handleAddSucataItem = () => {

    if (!sucataMatEncontrado) {

      setMaterialError("Selecione um material para sucata.");

      return;

    }

    if (!sucataQtd || sucataQtd < 0) {

      setMaterialError("Informe quantidade vlida para sucata.");

      return;

    }

    if (!sucataClassificacao) {

      setMaterialError("Informe a classificao da sucata.");

      return;

    }

    setMaterialError(null);

    setSucata((prev) =>

      prev.some((i) => i.codigo_material === sucataMatEncontrado.codigo_material)

        ? prev.map((i) =>

            i.codigo_material === sucataMatEncontrado.codigo_material

              ? {

                  ...i,

                  quantidade: i.quantidade + sucataQtd,

                  classificacao: sucataClassificacao,

                  descricao_item: i.descricao_item || sucataMatEncontrado.descricao || "",

                  unidade_medida: i.unidade_medida || sucataMatEncontrado.unidade_medida || "",

                }

              : i

          )

        : [

            ...prev,

            {

              codigo_material: sucataMatEncontrado.codigo_material,

              quantidade: sucataQtd,

              classificacao: sucataClassificacao,

              descricao_item: sucataMatEncontrado.descricao || "",

              unidade_medida: sucataMatEncontrado.unidade_medida || "",

            },

          ]

    );

    setSucataCodigo("");

    setSucataMatEncontrado(null);

    setSucataQtd(1);

    setSucataClassificacao(CLASSIFICACOES_SUCATA[0]);

  };



  const handleRemoveSucata = (codigo: string) => {

    setSucata((prev) => prev.filter((s) => s.codigo_material !== codigo));

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



  const handleUpdateSucataClassificacao = (codigo: string, cls: string) => {

    setSucata((prev) =>

      prev.map((c) =>

        c.codigo_material === codigo ? { ...c, classificacao: cls } : c

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

      // Atualiza carimbo de consumo de materiais e status

      await supabase

        .from("acionamentos")

        .update({ 
          materiais_consumidos_em: new Date().toISOString(),
          status: "em_execucao"
        })

        .eq("id_acionamento", selectedItem.id_acionamento);

      // Atualiza item local para refletir mudanças
      if (selectedItem) {
        selectedItem.status = "em_execucao";
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

      if (sucata.some((s) => !s.classificacao)) {

        throw new Error("Defina a classificao para todos os itens de sucata.");

      }

      await supabase.from("sucata_itens").delete().eq("id_acionamento", selectedItem.id_acionamento);

      if (sucata.length > 0) {

        const payload = sucata.map((s) => ({

          id_acionamento: selectedItem.id_acionamento,

          codigo_material: s.codigo_material,

          quantidade_retirada: s.quantidade,

          classificacao: s.classificacao || null,

        }));

        const { error } = await supabase.from("sucata_itens").insert(payload);

        if (error) throw error;

      }

      // Atualiza carimbo de envio de sucata

      await supabase

        .from("acionamentos")

        .update({ sucatas_enviadas_em: new Date().toISOString() })

        .eq("id_acionamento", selectedItem.id_acionamento);

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



  const formatDateBr = (date?: string | null) => {

    if (!date) return "--";

    const d = new Date(date);

    return isNaN(d.getTime()) ? "--" : d.toLocaleDateString("pt-BR");

  };



  const getDataTitulo = () => {

    const dataLista =

      preLista?.[0]?.criado_em ||

      selectedItem?.data_abertura ||

      new Date().toISOString();

    return formatDateBr(dataLista);

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

        {step.status === "completed" ? "Concludo" : step.status === "active" ? "Em andamento" : step.status === "alert" ? "Alerta" : "Pendente"}

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

              {item.municipio || "--"}  {item.modalidade || "--"}

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

          {selectedStep?.id === 3 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openMedicaoModal(item)}
            >
              Medição / Orçamento
            </Button>
          )}

          <Button

            size="sm"

            variant="outline"

            onClick={() => {

              if (selectedStep?.id === 2) {

                openExecModal(item);

              } else {

                navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`);

                setOpen(false);

              }

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



      <Dialog open={open} onOpenChange={setOpen} modal>

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



      <Dialog open={execModalOpen} onOpenChange={setExecModalOpen} modal>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

          <DialogHeader className="text-center space-y-1 items-center">

            <DialogTitle className="text-xl font-bold">{"Dados da Execu\u00e7\u00e3o do Acionamento"}</DialogTitle>
            <DialogDescription>{"Preencha os dados de execu\u00e7\u00e3o. Edit\u00e1vel apenas na Etapa 2."}</DialogDescription>
          </DialogHeader>



          {execError && <div className="text-sm text-destructive">{execError}</div>}

          {execInfo && <div className="text-sm text-emerald-600">{execInfo}</div>}



          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div>

                <Label>KM inicial</Label>

                <Input type="number" value={execForm.km_inicial} disabled={execReadonly} onChange={(e) => handleExecChange('km_inicial', e.target.value)} />

              </div>

              <div>

                <Label>KM final</Label>

                <Input type="number" value={execForm.km_final} disabled={execReadonly} onChange={(e) => handleExecChange('km_final', e.target.value)} />

              </div>

              <div>

                <Label>KM total</Label>

                <Input type="number" value={execForm.km_total} disabled readOnly />

              </div>

            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div>

                <Label>{"Sa\u00edda da base"}</Label>
                <Input type="datetime-local" value={execForm.saida_base} disabled={execReadonly} onChange={(e) => handleExecChange('saida_base', e.target.value)} />

              </div>

              <div>

                <Label>{"In\u00edcio do servi\u00e7o"}</Label>
                <Input type="datetime-local" value={execForm.inicio_servico} disabled={execReadonly} onChange={(e) => handleExecChange('inicio_servico', e.target.value)} />

              </div>

              <div>

                <Label>{"Retorno do servi\u00e7o"}</Label>
                <Input type="datetime-local" value={execForm.retorno_servico} disabled={execReadonly} onChange={(e) => handleExecChange('retorno_servico', e.target.value)} />

              </div>

              <div>

                <Label>{"Retorno \u00e0 base"}</Label>
                <Input type="datetime-local" value={execForm.retorno_base} disabled={execReadonly} onChange={(e) => handleExecChange('retorno_base', e.target.value)} />

              </div>

            </div>



            <div className="space-y-2">

              <Label>{"Houve troca de transformador?"}</Label>
              <div className="flex items-center gap-3">

                <label className="flex items-center gap-1 text-sm">

                  <input type="radio" name="trocaTrafo" checked={!!execForm.troca_transformador} disabled={execReadonly} onChange={() => handleExecChange('troca_transformador', true)} />{" "}Sim
                </label>

                <label className="flex items-center gap-1 text-sm">

                  <input type="radio" name="trocaTrafo" checked={!execForm.troca_transformador} disabled={execReadonly} onChange={() => handleExecChange('troca_transformador', false)} />{" "}{"N\u00e3o"}
                </label>

              </div>

            </div>



            {execForm.troca_transformador && (

              <div className="space-y-4">

                <div className="rounded-md border p-3 space-y-2">

                  <h4 className="font-semibold text-sm">{"Transformador retirado"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>{"Pot\u00eancia"}</Label><Input value={execForm.trafo_ret_potencia} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_potencia', e.target.value)} /></div>
                    <div><Label>Marca</Label><Input value={execForm.trafo_ret_marca} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_marca', e.target.value)} /></div>
                    <div><Label>Ano</Label><Input value={execForm.trafo_ret_ano} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_ano', e.target.value)} /></div>
                    <div><Label>{"Tens\u00e3o secund\u00e1ria"}</Label><Input value={execForm.trafo_ret_tensao_secundaria} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_tensao_secundaria', e.target.value)} /></div>
                    <div><Label>{"Tens\u00e3o prim\u00e1ria"}</Label><Input value={execForm.trafo_ret_tensao_primaria} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_tensao_primaria', e.target.value)} /></div>
                    <div><Label>{"N\u00famero de s\u00e9rie"}</Label><Input value={execForm.trafo_ret_numero_serie} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_numero_serie', e.target.value)} /></div>
                    <div><Label>{"Patrim\u00f4nio"}</Label><Input value={execForm.trafo_ret_patrimonio} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_ret_patrimonio', e.target.value)} /></div>
                  </div>
                </div>


                <div className="rounded-md border p-3 space-y-2">

                  <h4 className="font-semibold text-sm">{"Transformador instalado"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>{"Pot\u00eancia"}</Label><Input value={execForm.trafo_inst_potencia} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_inst_potencia', e.target.value)} /></div>
                    <div><Label>{"Tens\u00e3o secund\u00e1ria"}</Label><Input value={execForm.trafo_inst_tensao_secundaria} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_inst_tensao_secundaria', e.target.value)} /></div>
                    <div><Label>{"Tens\u00e3o prim\u00e1ria"}</Label><Input value={execForm.trafo_inst_tensao_primaria} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_inst_tensao_primaria', e.target.value)} /></div>
                    <div><Label>{"N\u00famero de s\u00e9rie"}</Label><Input value={execForm.trafo_inst_numero_serie} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_inst_numero_serie', e.target.value)} /></div>
                    <div><Label>{"Patrim\u00f4nio"}</Label><Input value={execForm.trafo_inst_patrimonio} disabled={execReadonly} onChange={(e) => handleExecChange('trafo_inst_patrimonio', e.target.value)} /></div>
                  </div>
                </div>


                <div className="rounded-md border p-3 space-y-2">

                  <h4 className="font-semibold text-sm">{"Tens\u00f5es"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                    <div><Label>A-N</Label><Input value={execForm.tensao_an} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_an', e.target.value)} /></div>

                    <div><Label>B-N</Label><Input value={execForm.tensao_bn} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_bn', e.target.value)} /></div>

                    <div><Label>C-N</Label><Input value={execForm.tensao_cn} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_cn', e.target.value)} /></div>

                    <div><Label>A-B</Label><Input value={execForm.tensao_ab} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_ab', e.target.value)} /></div>

                    <div><Label>B-C</Label><Input value={execForm.tensao_bc} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_bc', e.target.value)} /></div>

                    <div><Label>C-A</Label><Input value={execForm.tensao_ca} disabled={execReadonly} onChange={(e) => handleExecChange('tensao_ca', e.target.value)} /></div>

                  </div>

                </div>

              </div>

            )}



            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              <div><Label>Alimentador</Label><Input value={execForm.alimentador} disabled={execReadonly} onChange={(e) => handleExecChange('alimentador', e.target.value)} /></div>

              <div><Label>{"Subesta\u00e7\u00e3o"}</Label><Input value={execForm.subestacao} disabled={execReadonly} onChange={(e) => handleExecChange('subestacao', e.target.value)} /></div>
              <div><Label>Nº do transformador</Label><Input value={execForm.numero_transformador} disabled={execReadonly} onChange={(e) => handleExecChange('numero_transformador', e.target.value)} /></div>

              <div><Label>ID do poste</Label><Input value={execForm.id_poste} disabled={execReadonly} onChange={(e) => handleExecChange('id_poste', e.target.value)} /></div>

            </div>



            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              <div><Label>OS tablet</Label><Input value={execForm.os_tablet} disabled={execReadonly} onChange={(e) => handleExecChange('os_tablet', e.target.value)} /></div>

              <div><Label>SS (Nota)</Label><Input value={execForm.ss_nota} disabled={execReadonly} onChange={(e) => handleExecChange('ss_nota', e.target.value)} /></div>

              <div><Label>Nº da intervencao</Label><Input value={execForm.numero_intervencao} disabled={execReadonly} onChange={(e) => handleExecChange('numero_intervencao', e.target.value)} /></div>

            </div>



            <div>

              <Label>Observações gerais</Label>

              <textarea className="w-full border rounded-md px-3 py-2 text-sm min-h-[90px]" value={execForm.observacoes} disabled={execReadonly} onChange={(e) => handleExecChange('observacoes', e.target.value)} />

            </div>

          </div>



          <DialogFooter className="flex gap-2 justify-end">

            <Button variant="outline" onClick={() => setExecModalOpen(false)} disabled={execLoading}>Fechar</Button>

            {execReadonly ? null : (

              <Button onClick={saveExec} disabled={execLoading}>

                {execLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}

                Salvar

              </Button>

            )}

          </DialogFooter>

      </DialogContent>

    </Dialog>

      <Dialog open={medicaoModalOpen} onOpenChange={setMedicaoModalOpen} modal>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl font-bold">Medição / Orçamento</DialogTitle>
            <DialogDescription>Monte o orçamento de mão de obra. Nada é salvo; apenas cálculo/PDF.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {selectedItem?.modalidade?.toUpperCase() === "LM+LV" ? (
                <>
                  <Button variant={medicaoTab === "LM" ? "default" : "outline"} size="sm" onClick={() => setMedicaoTab("LM")}>LM</Button>
                  <Button variant={medicaoTab === "LV" ? "default" : "outline"} size="sm" onClick={() => setMedicaoTab("LV")}>LV</Button>
                </>
              ) : (
                <span className="text-sm font-medium px-3 py-1.5 rounded-md bg-muted">Modalidade: {selectedItem?.modalidade || "LM"}</span>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={medicaoForaHC} onChange={(e) => setMedicaoForaHC(e.target.checked)} className="w-4 h-4" />
              Fora do horário comercial
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar MO por código ou descrição" value={medicaoBusca} onChange={(e) => setMedicaoBusca(e.target.value)} />
              <div className="text-xs text-muted-foreground">Catálogo: {medicaoCatalogo.length}</div>
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {medicaoCatalogo
                .filter((m) => {
                  const buscaMatch = 
                    (m.codigo_mao_de_obra || "").toLowerCase().includes(medicaoBusca.toLowerCase()) ||
                    (m.descricao || "").toLowerCase().includes(medicaoBusca.toLowerCase());
                  const tipoMatch = (m.tipo || "").toUpperCase() === medicaoTab;
                  const naoEhAjusteHC = !["26376", "92525"].includes(m.codigo_mao_de_obra);
                  return buscaMatch && tipoMatch && naoEhAjusteHC;
                })
                .map((m) => (
                  <button
                    key={`${m.codigo_mao_de_obra}-${m.operacao}-${m.tipo}`}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => handleAddMedicaoItem(m)}
                  >
                    {m.codigo_mao_de_obra} - {m.descricao} (fração {m.operacao || 1}, UPS {m.ups || 0})
                  </button>
                ))}
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <h4 className="font-semibold text-sm">Itens {medicaoTab}</h4>
              {(medicaoItens[medicaoTab] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor UPS</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(medicaoItens[medicaoTab] || []).map((i) => (
                      <TableRow key={`${i.codigo}-${i.operacao}`}>
                        <TableCell>{i.codigo}</TableCell>
                        <TableCell>{i.operacao}</TableCell>
                        <TableCell>{i.descricao}</TableCell>
                        <TableCell>{i.unidade}</TableCell>
                        <TableCell className="max-w-[120px]">
                          <Input type="number" min={0} value={i.quantidade} onChange={(e) => handleQtdMedicao(i.codigo, i.operacao, Number(e.target.value))} />
                        </TableCell>
                        <TableCell>{Number(i.valorUps || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {subtotalMedicao(i).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveMedicao(i.codigo, i.operacao)}>Remover</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="text-right font-semibold">
                Total {medicaoTab}: {totalAbaMedicao(medicaoTab).toFixed(2)}
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <h4 className="font-semibold text-sm">Materiais (referência)</h4>
              {materiaisReferencia.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum material aplicado.</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {materiaisReferencia.map((m: any) => (
                    <li key={m.codigo_material}>
                      {m.codigo_material} - {m.descricao_item} ({m.unidade_medida}) — {m.quantidade}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setMedicaoModalOpen(false)}>Fechar</Button>
            <Button onClick={gerarOrcamento}>Gerar orçamento (PDF)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen} modal>

        <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] overflow-y-auto px-3 sm:px-6">

          <DialogHeader className="text-center space-y-1 items-center">

            <DialogTitle className="text-xl font-bold">

              {`Acionamento ${selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--"} - ${selectedItem?.municipio || "--"} - ${getDataTitulo()}`}

            </DialogTitle>

            {selectedStep?.id !== 1 && (

              <DialogDescription className="text-base">{"Materiais da Execu\u00e7\u00e3o"}</DialogDescription>

            )}

          </DialogHeader>



          {materialsLoading ? (

            <div className="flex items-center gap-2 text-sm text-muted-foreground">

              <Loader2 className="h-4 w-4 animate-spin" /> Carregando listas...

            </div>

          ) : selectedStep?.id === 1 ? (

            <div className="space-y-4">

              <div className="rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-sm">

                <h4 className="text-sm font-semibold mb-3">Adicionar material</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">

                  <div className="md:col-span-3">

                    <Label>Código ou descrição</Label>

                    <Input

                      value={preCodigo}

                      onChange={(e) => setPreCodigo(e.target.value)}

                      placeholder="Ex.: MAT-001 ou parte da descricao"

                    />

                    {loadingSugestoesPre && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}

                    {preSugestoes.length > 0 && (

                      <div className="mt-1 rounded-md border bg-background shadow-sm max-h-40 overflow-y-auto">

                        {preSugestoes.map((m: any) => (

                          <button

                            key={m.codigo_material}

                            type="button"

                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"

                            onClick={() => handleSelectPreSugestao(m)}

                          >

                            {m.codigo_material} - {m.descricao} ({m.unidade_medida})

                          </button>

                        ))}

                      </div>

                    )}

                  </div>

                  <div className="flex items-end gap-2">

                    <Button onClick={handleAddPreItem} disabled={!preMatEncontrado}>

                      <Plus className="h-4 w-4 mr-2" /> Adicionar

                    </Button>

                  </div>

                </div>

                {preMatEncontrado && (

                  <p className="text-xs text-muted-foreground mt-2">

                    {preMatEncontrado.codigo_material} - {preMatEncontrado.descricao} ({preMatEncontrado.unidade_medida})

                  </p>

                )}

              </div>



              <div className="rounded-xl border border-border/60 bg-card/80 p-3 sm:p-4 shadow-sm space-y-2">

                <div className="flex items-center justify-end">

                  {preLista.length > 0 && (

                    <span className="text-xs text-muted-foreground">{preLista.length} item(s)</span>

                  )}

                </div>

                {preLista.length === 0 ? (

                  <p className="text-sm text-muted-foreground">Nenhum item na pre-lista.</p>

                ) : (

                  <div className="overflow-x-auto">

                    <Table>

                      <TableHeader>

                        <TableRow>

                          <TableHead>Código</TableHead>

                          <TableHead>Descrição</TableHead>

                          <TableHead>Unidade</TableHead>

                          <TableHead>Quantidade</TableHead>

                          <TableHead className="text-right"></TableHead>

                        </TableRow>

                      </TableHeader>

                      <TableBody>

                        {preLista.map((p) => (

                          <TableRow key={p.codigo_material}>

                            <TableCell>{p.codigo_material}</TableCell>

                            <TableCell>{p.descricao_item || "-"}</TableCell>

                            <TableCell>{p.unidade_medida || "-"}</TableCell>

                            <TableCell className="max-w-[140px]">

                              <Input

                                type="number"

                                min={0}

                                step={0.01}

                                value={p.quantidade_prevista}

                                onChange={(e) =>

                                  handleUpdatePreQuantidade(p.codigo_material, Number(e.target.value))

                                }

                              />

                            </TableCell>

                            <TableCell className="text-right">

                              <Button variant="ghost" size="sm" onClick={() => handleRemovePreItem(p.codigo_material)}>

                                Remover

                              </Button>

                            </TableCell>

                          </TableRow>

                        ))}

                      </TableBody>

                    </Table>

                  </div>

                )}

                <div className="flex items-center gap-2 pt-1">

                  <input

                    type="checkbox"

                    id="almox-conferido"

                    checked={almoxConferido}

                    disabled={preLista.length === 0}

                    onChange={(e) => handleToggleAlmox(e.target.checked)}

                  />

                  <Label htmlFor="almox-conferido" className="text-sm">

                    Conferido pelo almox

                  </Label>

                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">

                  <div className="flex-1 flex items-center gap-2">

                    {(() => {

                      const encList = uniqueEncarregados(encarregadoNome || selectedItem?.encarregado || "");

                      if (encList.length > 0) {

                          return (

                            <div className="flex items-center gap-2">

                              <Label className="text-xs text-muted-foreground">Encarregado:</Label>

                              <select

                                className="border rounded-md px-2 py-1 text-sm"

                                value={encarregadoSelecionado}

                                onChange={(e) => setEncarregadoSelecionado(e.target.value)}

                              >

                                <option value="">Selecione</option>

                                {encList.map((n) => (

                                  <option key={n} value={n}>

                                    {n}

                                  </option>

                                ))}

                              </select>

                            </div>

                          );

                        }

                        return (

                          <div className="flex items-center gap-2">

                            <Label className="text-xs text-muted-foreground">Encarregado:</Label>

                            <input

                              className="border rounded-md px-2 py-1 text-sm"

                              placeholder="Digite o encarregado"

                              value={encarregadoSelecionado}

                              onChange={(e) => setEncarregadoSelecionado(e.target.value)}

                            />

                          </div>

                        );

                      })()}

                    </div>

                    {(() => {

                      const encList = uniqueEncarregados(encarregadoNome || selectedItem?.encarregado || "");

                      const precisaEscolher =

                        (encList.length > 1 && !encarregadoSelecionado) ||

                        (encList.length === 0 && !encarregadoSelecionado);

                      return (

                        <Button

                          variant="outline"

                          onClick={exportPreListaPdf}

                          disabled={preLista.length === 0 || precisaEscolher}

                          title={precisaEscolher ? "Selecione um encarregado para gerar o PDF" : ""}

                        >

                          <FileDown className="h-4 w-4 mr-2" />

                          Exportar PDF

                        </Button>

                      );

                    })()}

                    <Button onClick={savePreLista} disabled={savingPre}>

                      {savingPre ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}

                      Salvar

                    </Button>

                  </div>

                </div>

            </div>

          ) : (

            <div className="space-y-4">

              <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">

                <div className="flex items-center justify-between">

                  <h4 className="text-sm font-semibold">Material aplicado (consumo real)</h4>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">

                  <div className="md:col-span-3">

                    <Label>Código ou descrição</Label>

                    <Input

                      value={consumoCodigo}

                      onChange={(e) => setConsumoCodigo(e.target.value)}

                      placeholder="Ex.: MAT-001 ou parte da descricao"

                    />

                    {loadingSugestoesConsumo && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}

                    {consumoSugestoes.length > 0 && (

                      <div className="mt-1 rounded-md border bg-background shadow-sm max-h-40 overflow-y-auto">

                        {consumoSugestoes.map((m: any) => (

                          <button

                            key={m.codigo_material}

                            type="button"

                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"

                            onClick={() => handleSelectConsumoSugestao(m)}

                          >

                            {m.codigo_material} - {m.descricao} ({m.unidade_medida})

                          </button>

                        ))}

                      </div>

                    )}

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

                  <div className="flex items-end">

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

                  <div className="overflow-x-auto">

                    <Table>

                      <TableHeader>

                        <TableRow>

                          <TableHead>Código</TableHead>

                          <TableHead>Descrição</TableHead>

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

                  </div>

                )}

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">

                  <Button onClick={saveConsumo} disabled={savingConsumo}>

                    {savingConsumo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}

                    Salvar

                  </Button>

                </div>

              </div>



              <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">

                <h4 className="text-sm font-semibold">Materiais retirados (sucata)</h4>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">

                  <div className="md:col-span-3">

                    <Label>Código ou descrição</Label>

                    <Input

                      value={sucataCodigo}

                      onChange={(e) => setSucataCodigo(e.target.value)}

                      placeholder="Ex.: MAT-001 ou parte da descricao"

                    />

                    {loadingSugestoesSucata && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}

                    {sucataSugestoes.length > 0 && (

                      <div className="mt-1 rounded-md border bg-background shadow-sm max-h-40 overflow-y-auto">

                        {sucataSugestoes.map((m: any) => (

                          <button

                            key={m.codigo_material}

                            type="button"

                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"

                            onClick={() => handleSelectSucataSugestao(m)}

                          >

                            {m.codigo_material} - {m.descricao} ({m.unidade_medida})

                          </button>

                        ))}

                      </div>

                    )}

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

                  <div>

                    <Label>Classificacao</Label>

                    <select

                      className="border rounded-md px-3 py-2 text-sm w-full"

                      value={sucataClassificacao}

                      onChange={(e) => setSucataClassificacao(e.target.value)}

                    >

                      {CLASSIFICACOES_SUCATA.map((c) => (

                        <option key={c} value={c}>

                          {c}

                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="flex items-end">

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

                  <div className="overflow-x-auto">

                    <Table>

                      <TableHeader>

                        <TableRow>

                          <TableHead>Código</TableHead>

                          <TableHead>Descrição</TableHead>

                          <TableHead>Unidade</TableHead>

                          <TableHead>Quantidade</TableHead>

                          <TableHead>Classificacao</TableHead>

                          <TableHead className="text-right"></TableHead>

                        </TableRow>

                      </TableHeader>

                      <TableBody>

                        {sucata.map((s) => (

                          <TableRow key={`${s.codigo_material}-${s.classificacao ?? ""}`}>

                            <TableCell>{s.codigo_material}</TableCell>

                            <TableCell>{s.descricao_item || s.descricao || "-"}</TableCell>

                            <TableCell>{s.unidade_medida || "-"}</TableCell>

                            <TableCell>

                              <Input

                                type="number"

                                min={0}

                                step={0.01}

                                value={s.quantidade}

                                onChange={(e) => handleUpdateSucataQuantidade(s.codigo_material, Number(e.target.value))}

                              />

                            </TableCell>

                            <TableCell>

                              <select

                                className="border rounded-md px-2 py-1 text-sm w-full"

                                value={s.classificacao || ""}

                                onChange={(e) => handleUpdateSucataClassificacao(s.codigo_material, e.target.value)}

                              >

                                <option value="">Selecione</option>

                                {CLASSIFICACOES_SUCATA.map((c) => (

                                  <option key={c} value={c}>

                                    {c}

                                  </option>

                                ))}

                              </select>

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

                  </div>

                )}

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">

                  <Button variant="destructive" onClick={saveSucata} disabled={savingSucata}>

                    {savingSucata ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}

                    Salvar

                  </Button>

                </div>

              </div>

            </div>

          )}



          {(materialError || materialInfo) && (

            <div className="pt-4 text-center text-sm">

              {materialError && <div className="text-destructive">{materialError}</div>}

              {materialInfo && <div className="text-emerald-600">{materialInfo}</div>}

            </div>

          )}

        </DialogContent>

      </Dialog>

    </Card>

  );

};







