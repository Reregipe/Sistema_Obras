import { FormEvent, useEffect, useState, useCallback, useRef, useMemo, createContext, useContext } from "react";
import logoEngeletrica from "@/assets/logo-engeletrica.png";
import lmMedicaoTemplateUrl from "@/assets/A - PLANILHA LM MEDIÇAO - MODELO.xlsx?url";
import lvMedicaoTemplateUrl from "@/assets/A - PLANILHA LV MEDIÇÃO - MODELO.xlsx?url";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CheckCircle2, Clock, AlertCircle, FileText, Wrench, TrendingUp, ArrowRight, Loader2, Plus, Save, FileDown, LayoutGrid } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportBookToExcel } from "@/utils/exportBookToExcel";
import { exportTrafoBookToExcel, trafoPhotoSlots, TrafoPhotoKey } from "@/utils/exportTrafoBookToExcel";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";
import {
  type EquipeLinha,
  getEquipeInfoByCodigo,
  inferEquipePorEncarregado,
  inferLinhaPorCodigo,
  inferLinhaPorEncarregado,
} from "@/data/equipesCatalog";

type EquipeEntry = { nome: string; linha?: EquipeLinha; encarregado?: string | null };

type PreListaPdfContext = {
  acionamento: any;
  encarregadoAss: string;
  printedBy: string;
};

type OrcamentoPdfContext = {
  idAcionamento: string;
  pdfModalidade: "LM" | "LV";
  selectedItemSnapshot: any;
  dadosExec: any;
  detalhesAcionamento: any;
  headerBase: Record<string, any>;
  numeroIntervencaoTexto: string;
  dataExecucaoTexto: string;
  codigoAcionamento: string;
  equipeTexto: string;
  encarregadoTexto: string;
  tecnicoTexto: string;
  enderecoTexto: string;
  alimentadorTexto: string;
  subestacaoTexto: string;
  alimentadorSubTexto: string;
  osTabletTexto: string;
  itensMO: any[];
  consumo: any[];
  sucata: any[];
  medicaoValorUpsLM: number;
  medicaoValorUpsLV: number;
  medicaoForaHC: boolean;
  medicaoItensSnapshot: Record<"LM" | "LV", any[]>;
  medicaoTab: "LM" | "LV";
  currentUserNameSnapshot: string;
  numeroSigod?: string;
  numeroSs?: string;
  equipeInfo?: {
    codigoSelecionado?: string;
    linhaSelecionada?: EquipeLinha;
    encarregadoSelecionado?: string;
  };
  detalhesEquipes?: {
    encarregadoLinhaLM?: string;
    encarregadoLinhaLV?: string;
    encarregadoPrincipal?: string;
    principalLinhaInferida?: EquipeLinha;
  };
};

type MedicaoRascunho = {
  itens_lm?: any[];
  itens_lv?: any[];
  valor_ups_lm?: number;
  valor_ups_lv?: number;
  fora_horario?: boolean;
};

const MODALIDADES_MEDICAO: ("LM" | "LV")[] = ["LM", "LV"];
const RETORNO_MODALIDADES: ("LM" | "LV")[] = ["LM", "LV"];
const STATUS_OPTIONS = [
  { label: "Aberto", value: "aberto" },
  { label: "Despachado", value: "despachado" },
  { label: "Em execução", value: "em_execucao" },
  { label: "Concluído", value: "concluido" },
];
const PRIORIDADE_OPTIONS = [
  { label: "Emergência", value: "emergencia" },
  { label: "Programado", value: "programado" },
  { label: "Planejado", value: "planejado" },
];
const MODALIDADE_OPTIONS = ["LM", "LV", "LM+LV"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  active: "Em andamento",
  alert: "Alerta",
  completed: "Concluído",
};
const DOSSIER_TABS = [
  { id: "registro", label: "Registro" },
  { id: "book", label: "Book" },
  { id: "ditais", label: "DITAIS" },
  { id: "trafo", label: "Trafo" },
  { id: "retorno", label: "Retorno" },
  { id: "auditoria", label: "Auditoria" },
  { id: "aprovacao", label: "Aprovação" },
];

const hasDadosMedicao = (contexto?: OrcamentoPdfContext | null) =>
  Boolean(contexto && (contexto.itensMO?.length ?? 0) > 0);

const obterModalidadesDisponiveis = (
  contexto: Record<"LM" | "LV", OrcamentoPdfContext | null>
): ("LM" | "LV")[] => MODALIDADES_MEDICAO.filter((modalidade) => hasDadosMedicao(contexto[modalidade]));

const formatModalidadeLabel = (modalidade: "LM" | "LV") =>
  modalidade === "LM" ? "Linha Morta" : "Linha Viva";

const parseMedicaoItens = (value: unknown): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return [];
    }
  }
  return [];
};

const toRetornoRowFromRecord = (record: RetornoItemRecord): RetornoRow => {
  const quantidade = Number(record.quantidade ?? 0);
  const ups = Number(record.ups ?? 0);
  const valor =
    Number(
      record.total_valor ??
        record.subtotal ??
        record.total ??
        (quantidade && ups ? quantidade * ups : 0)
    ) || 0;
  const unitPrice = quantidade ? valor / quantidade : 0;
  return {
    codigo: record.codigo,
    descricao: record.descricao || undefined,
    quantidadeEnviada: quantidade,
    upsEnviado: ups,
    totalEnviado: valor,
    quantidadeAprovada: quantidade,
    upsAprovado: ups,
    totalAprovado: valor,
    unitPrice,
    regraAplicada: record.regra_aplicada || undefined,
  };
};

const buildRetornoRowsFromItems = (items: any[]): RetornoRow[] => {
  return items.map((item) => {
    const quantidade = Number(item.quantidade ?? item.qtd ?? 0);
    const ups = Number(item.valorUps ?? item.ups ?? item.upsQtd ?? 0);
    const total =
      Number(item.total ?? item.valor_total ?? item.subtotal ?? 0) ||
      quantidade * ups;
    return {
      codigo: item.codigo || item.codigo_material || "--",
      descricao: item.descricao || item.descricao_item || undefined,
      quantidadeEnviada: quantidade,
      upsEnviado: ups,
      totalEnviado: total,
      quantidadeAprovada: quantidade,
      upsAprovado: ups,
      totalAprovado: total,
      regraAplicada: item.regra_aplicada || undefined,
    };
  });
};

const buildRowsFromResumo = (resumo: MaoDeObraResumo): RetornoRow[] => {
  return resumo.itensCalculados.map((item) => ({
    codigo: item.codigo,
    descricao: item.descricao,
    quantidadeEnviada: item.quantidade,
    upsEnviado: item.upsQtd,
    totalEnviado: item.subtotal,
    quantidadeAprovada: item.quantidade,
    upsAprovado: item.upsQtd,
    totalAprovado: item.subtotal,
    regraAplicada: undefined,
  }));
};

const buildRowsFromRetornoRecords = (records: RetornoItemRecord[]): RetornoRow[] => {
  const grouped = new Map<
    string,
    {
      codigo: string;
      descricao?: string;
      enviado?: RetornoItemRecord;
      aprovado?: RetornoItemRecord;
    }
  >();

  records.forEach((record) => {
    const key = record.codigo || `${record.id}`;
    const entry = grouped.get(key) || { codigo: record.codigo || "--" };
    entry.descricao = entry.descricao || record.descricao;
    if (record.origem === "APROVADO") {
      entry.aprovado = record;
    } else {
      entry.enviado = record;
    }
    grouped.set(key, entry);
  });

  const rows: RetornoRow[] = [];
  grouped.forEach((entry) => {
    const quantidadeEnviada = entry.enviado?.quantidade ?? entry.aprovado?.quantidade ?? 0;
    const upsEnviado = entry.enviado?.ups ?? entry.aprovado?.ups ?? 0;
    const totalEnviadoRaw =
      entry.enviado?.total_valor ?? quantidadeEnviada * upsEnviado ?? 0;
    const totalEnviado = parseNumberValue(totalEnviadoRaw);
    const quantidadeAprovada = entry.aprovado?.quantidade ?? quantidadeEnviada;
    const upsAprovado = entry.aprovado?.ups ?? upsEnviado;
    const totalAprovadoRaw =
      entry.aprovado?.total_valor ?? quantidadeAprovada * upsAprovado ?? 0;
    const totalAprovado = parseNumberValue(totalAprovadoRaw);
    const unitPrice = quantidadeEnviada ? totalEnviado / quantidadeEnviada : upsEnviado;
    rows.push({
      codigo: entry.codigo,
      descricao: entry.descricao,
      quantidadeEnviada,
      upsEnviado,
      totalEnviado,
      quantidadeAprovada,
      upsAprovado,
      totalAprovado,
      unitPrice,
      regraAplicada: entry.aprovado?.regra_aplicada || entry.enviado?.regra_aplicada,
    });
  });

  return rows;
};

const renderRetornoReferenciaPanel = (
  contexto: OrcamentoPdfContext | null,
  resumo: MaoDeObraResumo | null
) => {
  if (!contexto || !resumo) {
    return (
      <div className="rounded-xl border border-muted/60 bg-muted/10 p-4 text-center text-sm text-muted-foreground">
        Nenhum dado de medição disponível para esta modalidade.
      </div>
    );
  }
  const modalidadeLabel = contexto.pdfModalidade === "LM" ? "Linha Morta" : "Linha Viva";
  const itensPreview = resumo.itensCalculados.slice(0, 3);
  return (
    <div className="space-y-4">
        <div className="rounded-xl border border-muted/100 bg-muted/10 p-3 text-xs text-muted-foreground flex items-center justify-between">
          <span className="font-semibold text-muted-foreground">Adicional aplicado</span>
          <span className="text-sm text-foreground">
            {contexto.medicaoForaHC ? "30% (SERV. EMERG.)" : "12% (HORÁRIO COMERCIAL)"}
          </span>
        </div>
        <div className="rounded-xl border border-muted/100 bg-muted/10 p-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Total da aba</p>
          <div className="text-3xl font-semibold text-foreground">{formatCurrency(resumo.totalComAdicional)}</div>
          <div className="flex flex-col text-xs text-muted-foreground">
            <span>
              Base: <span className="font-semibold text-foreground">{formatCurrency(resumo.totalBase)}</span>
            </span>
            <span>
              Adicional: <span className="font-semibold text-foreground">{formatCurrency(resumo.totalComAdicional - resumo.totalBase)}</span>
            </span>
          </div>
        </div>
      <div className="rounded-xl border border-muted/100 bg-muted/10 p-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Últimos itens</p>
        {itensPreview.length > 0 ? (
          itensPreview.map((item) => (
            <div key={item.index} className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="truncate">
                {item.index}. {item.descricao || item.codigo}
              </span>
              <span className="font-semibold text-foreground">{formatCurrency(item.subtotal)}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Sem itens registrados.</p>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{contexto.codigoAcionamento || "--"}</p>
          <p>Código do acionamento</p>
        </div>
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{contexto.numeroIntervencaoTexto || "--"}</p>
          <p>Número intervenção</p>
        </div>
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{contexto.dataExecucaoTexto || "--"}</p>
          <p>Data execução</p>
        </div>
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">{contexto.equipeTexto || "--"}</p>
          <p>Equipe</p>
        </div>
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
          <p className="font-semibold text-foreground truncate">{contexto.enderecoTexto || "--"}</p>
          <p>Endereço</p>
        </div>
        <div className="rounded-md border border-muted/100 bg-background/50 px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
          <p className="font-semibold text-foreground truncate">{contexto.alimentadorSubTexto || "--"}</p>
          <p>Alimentador / Subestação</p>
        </div>
      </div>
    </div>
  );
};

type MaoDeObraResumo = {
  itensCalculados: {
    index: number;
    codigo: string;
    descricao: string;
    unidade: string;
    operacao: string;
    upsQtd: number;
    quantidade: number;
    subtotal: number;
  }[];
  totalBase: number;
  totalComAdicional: number;
  acrescimoValor: number;
  acrescimoInfo: { codigo: string; descricao: string };
};

type AuditItemStatus = "integral" | "parcial" | "glosado" | "ajuste" | "excluido";

type AuditComparisonRow = {
  codigo: string;
  descricao: string;
  quantidadeEnviada: number;
  upsEnviado: number;
  totalEnviado: number;
  quantidadeAprovada: number;
  upsAprovado: number;
  totalAprovado: number;
  difference: number;
  differencePercent: number;
  valorRetido: number;
  regraAplicada?: string;
  status: AuditItemStatus;
  alertAuditoria: boolean;
};

type AuditSummary = {
  totalEnviado: number;
  totalAprovado: number;
  diferenca: number;
  diferencaPercent: number;
  itensComDivergencia: number;
  valorRetido: number;
};

type RuleImpact = {
  regra: string;
  itens: number;
  impacto: number;
};

type TimelinePoint = {
  label: string;
  value: number;
};

type AuditComparison = {
  summary: AuditSummary;
  rows: AuditComparisonRow[];
  ruleImpact: RuleImpact[];
  timeline: TimelinePoint[];
  statusBreakdown: Record<AuditItemStatus, number>;
};

type RetornoItemRecord = {
  id: string;
  origem: "ENVIADO" | "APROVADO";
  modalidade: "LM" | "LV";
  codigo: string;
  descricao?: string;
  quantidade?: number;
  ups?: number;
  total_valor?: number;
  regra_aplicada?: string;
};

type RetornoRow = {
  codigo: string;
  descricao?: string;
  quantidadeEnviada: number;
  upsEnviado: number;
  totalEnviado: number;
  quantidadeAprovada: number;
  upsAprovado: number;
  totalAprovado: number;
  unitPrice: number;
  regraAplicada?: string;
};

const AUDIT_STATUS_LABELS: Record<AuditItemStatus, string> = {
  integral: "Aprovado Integral",
  parcial: "Aprovado Parcial",
  glosado: "Glosado",
  ajuste: "Ajustado por Regra",
  excluido: "Item Excluído",
};

const AUDIT_STATUS_CLASSES: Record<AuditItemStatus, string> = {
  integral: "bg-emerald-100 text-emerald-700",
  parcial: "bg-amber-100 text-amber-700",
  glosado: "bg-red-100 text-red-700",
  ajuste: "bg-blue-100 text-blue-700",
  excluido: "bg-slate-100 text-slate-700",
};

type AprovacaoStatus = "aguardando" | "reprovado" | "concluido";

type AprovacaoLog = {
  id_log: string;
  status: AprovacaoStatus;
  observacao: string | null;
  criado_em: string;
};

type AprovacaoLogForm = {
  status: AprovacaoStatus;
  observacao: string;
  data: string;
};

const APROVACAO_STATUS_LABELS: Record<AprovacaoStatus, string> = {
  aguardando: "Aguardando",
  reprovado: "Reprovado",
  concluido: "Concluído",
};

const APROVACAO_STATUS_CLASSES: Record<AprovacaoStatus, string> = {
  aguardando: "text-orange-700 bg-orange-50",
  reprovado: "text-red-700 bg-red-50",
  concluido: "text-emerald-700 bg-emerald-50",
};

const emptyAprovacaoLogForm: AprovacaoLogForm = {
  status: "aguardando",
  observacao: "",
  data: "",
};

const isUuidValue = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

const formatPercent = (value: number) => {
  if (!isFinite(value)) return "0,00%";
  return `${value.toFixed(2)}%`;
};

const parseNumberValue = (value?: string | number | null) => {
  if (typeof value === "number") return value;
  if (value == null) return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const nearlyEquals = (a: number, b: number, epsilon = 0.01) => Math.abs(a - b) <= epsilon;

const deriveAuditStatus = (
  totalEnviado: number,
  totalAprovado: number,
  regraAplicada?: string
): AuditItemStatus => {
  if (totalAprovado <= 0 || (!totalEnviado && totalAprovado === 0)) {
    return "excluido";
  }
  if (nearlyEquals(totalEnviado, totalAprovado)) {
    return "integral";
  }
  if (regraAplicada) {
    return "ajuste";
  }
  if (totalAprovado < totalEnviado) {
    return "glosado";
  }
  return "parcial";
};

const buildTimelineSeries = (
  baseDate: string | null | undefined,
  valorRetido: number
): TimelinePoint[] => {
  const now = baseDate ? new Date(baseDate) : new Date();
  const points: TimelinePoint[] = [];
  for (let idx = 2; idx >= 0; idx--) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - idx);
    points.push({
      label: date.toLocaleString("pt-BR", { month: "short", year: "numeric" }),
      value: Number(((idx + 1) / 3) * valorRetido),
    });
  }
  return points;
};

const generateLoteRetornoId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const normalizeLinha = (valor?: string | null): EquipeLinha | undefined => {
  if (!valor) return undefined;
  const text = valor.trim();
  if (/^lv$/i.test(text) || /linha viva/i.test(text) || /^viva$/i.test(text)) return "LV";
  if (/^lm$/i.test(text) || /linha morta/i.test(text) || /^morta$/i.test(text)) return "LM";
  return undefined;
};

const extrairSiglaEquipe = (nome?: string) => {
  if (!nome) return "";
  const texto = nome.trim();
  if (!texto) return "";
  const prefix = texto.includes("-") ? texto.split("-")[0]?.trim() : texto;
  const codigoMatch = prefix.match(/[A-Za-z]{1,4}\d{1,4}/);
  return (codigoMatch ? codigoMatch[0] : prefix).toUpperCase();
};

const formatEquipeDisplay = (info?: EquipeEntry, modalidade: EquipeLinha = "LM") => {
  if (!info?.nome) return "";
  const sigla = extrairSiglaEquipe(info.nome);
  if (info.linha === "LV" && modalidade === "LM") {
    return `Equipe LV: ${sigla}`;
  }
  if (info.linha === "LM" && modalidade === "LV") {
    return `Equipe LM: ${sigla}`;
  }
  return sigla;
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const pickValue = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const extrairCandidatosEquipe = (fonte?: any): string[] => {
  if (!fonte) return [];
  return [
    fonte.equipe_lm,
    fonte.codigo_equipe,
    fonte.equipe,
    fonte.nome_equipe,
    fonte.id_equipe,
  ]
    .map((valor) => (typeof valor === "string" ? valor.trim() : ""))
    .filter((valor) => !!valor && !isUuidValue(valor));
};

const inferirEquipePreferencial = (
  linhaDesejada: EquipeLinha,
  fontes: any[] = [],
  codigosExtras: string[] = []
): string | undefined => {
  const candidatos = [
    ...codigosExtras,
    ...fontes.flatMap((fonte) => extrairCandidatosEquipe(fonte)),
  ];

  for (const candidato of candidatos) {
    const linha = inferLinhaPorCodigo(candidato);
    if (linha === linhaDesejada) {
      return candidato;
    }
  }

  for (const fonte of fontes) {
    if (!fonte) continue;
    const encarregados = [
      fonte.encarregado_lm,
      fonte.encarregado,
      fonte.encarregado_nome,
      fonte.responsavel,
      fonte.responsavel_nome,
    ].filter((nome) => typeof nome === "string" && nome.trim().length > 0);

    for (const nome of encarregados) {
      const deducao = inferEquipePorEncarregado(nome);
      if (deducao?.linha === linhaDesejada) {
        return deducao.codigo;
      }
    }
  }

  return undefined;
};



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
    description: "OS formal com dados e evidências",
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
    description: "Book com fotos e relatórios",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    route: "/obras",
    count: 0,
    status: "pending",
  },
  {
    id: 6,
    title: "Aprovação Fiscal",
    description: "Análise de evidências e conformidade",
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
    description: "TCI emitido e pendências tratadas",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    route: "/obras",
    count: 0,
    status: "active",
  },
  {
    id: 8,
    title: "Aprovação da medição",
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
    title: "Geração de lote",
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
    title: "Emissão de NF",
    description: "Nota fiscal para concessionária",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    route: "/medicoes",
    count: 0,
    status: "completed",
  },
];



const CLASSIFICACOES_SUCATA = ["sucata", "reforma", "bom", "descarte"];

export type WorkflowModalContextValue = {
  openAcionamento: (item: any) => void;
};

export const WorkflowModalContext = createContext<WorkflowModalContextValue | null>(null);

export const useWorkflowModal = () => {
  const ctx = useContext(WorkflowModalContext);
  if (!ctx) {
    throw new Error("useWorkflowModal must be used within WorkflowSteps");
  }
  return ctx;
};



export const WorkflowSteps = () => {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [encarregadoNome, setEncarregadoNome] = useState<string>("");

  const [encarregadoSelecionado, setEncarregadoSelecionado] = useState<string>("");

  const [almoxConferido, setAlmoxConferido] = useState<boolean>(false);

  const [execModalOpen, setExecModalOpen] = useState(false);

  const [execLoading, setExecLoading] = useState(false);

  const [execError, setExecError] = useState<string | null>(null);

  const [execInfo, setExecInfo] = useState<string | null>(null);

  const [execReadonly, setExecReadonly] = useState(false);

  // Etapa 4 - Registro de OS
  const emptyOsForm = {
    numero_os: "",
    os_criada_em: "",
    observacoes: "",
  };
  const [osModalOpen, setOsModalOpen] = useState(false);
  const [osLoading, setOsLoading] = useState(false);
  const [osSaving, setOsSaving] = useState(false);
  const [osError, setOsError] = useState<string | null>(null);
  const [osInfo, setOsInfo] = useState<string | null>(null);
  const [osForm, setOsForm] = useState({ ...emptyOsForm });
  const [osElementoId, setOsElementoId] = useState("");
  const emptyNumeroObraForm = {
    numero_obra: "",
    numero_obra_atualizado_em: "",
  };
  const [numeroModalOpen, setNumeroModalOpen] = useState(false);
  const [numeroLoading, setNumeroLoading] = useState(false);
  const [numeroSaving, setNumeroSaving] = useState(false);
  const [numeroError, setNumeroError] = useState<string | null>(null);
  const [numeroInfo, setNumeroInfo] = useState<string | null>(null);
  const [numeroForm, setNumeroForm] = useState({ ...emptyNumeroObraForm });

  const emptyFiscalForm = {
    assinatura_fiscal_em: "",
  };
  const [fiscalModalOpen, setFiscalModalOpen] = useState(false);
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [fiscalSaving, setFiscalSaving] = useState(false);
  const [fiscalError, setFiscalError] = useState<string | null>(null);
  const [fiscalInfo, setFiscalInfo] = useState<string | null>(null);
  const [fiscalForm, setFiscalForm] = useState({ ...emptyFiscalForm });

    const emptyTciForm = {
      tci_criado_em: "",
    };
    const [tciModalOpen, setTciModalOpen] = useState(false);
    const [tciLoading, setTciLoading] = useState(false);
    const [tciSaving, setTciSaving] = useState(false);
    const [tciError, setTciError] = useState<string | null>(null);
    const [tciInfo, setTciInfo] = useState<string | null>(null);
    const [tciForm, setTciForm] = useState({ ...emptyTciForm });
  const [aprovacaoModalOpen, setAprovacaoModalOpen] = useState(false);
  const [aprovacaoLoading, setAprovacaoLoading] = useState(false);
  const [aprovacaoSaving, setAprovacaoSaving] = useState(false);
  const [aprovacaoError, setAprovacaoError] = useState<string | null>(null);
  const [aprovacaoInfo, setAprovacaoInfo] = useState<string | null>(null);
  const [aprovacaoLogs, setAprovacaoLogs] = useState<AprovacaoLog[]>([]);
  const [aprovacaoLogsPreview, setAprovacaoLogsPreview] = useState<AprovacaoLog[]>([]);
  const [aprovacaoLogForm, setAprovacaoLogForm] = useState<AprovacaoLogForm>({
    ...emptyAprovacaoLogForm,
  });
  const [aprovacaoContextoPreview, setAprovacaoContextoPreview] = useState<
    Record<"LM" | "LV", OrcamentoPdfContext | null>
  >({
    LM: null,
    LV: null,
  });
  const [aprovacaoResumoPreview, setAprovacaoResumoPreview] = useState<
    Record<"LM" | "LV", MaoDeObraResumo | null>
  >({
    LM: null,
    LV: null,
  });
  const [aprovacaoPreviewModalidade, setAprovacaoPreviewModalidade] = useState<"LM" | "LV">("LM");
  const [etapa9ModalOpen, setEtapa9ModalOpen] = useState(false);
  const [etapa9Loading, setEtapa9Loading] = useState(false);
  const [etapa9Saving, setEtapa9Saving] = useState(false);
  const [etapa9Error, setEtapa9Error] = useState<string | null>(null);
  const [etapa9NumeroLote, setEtapa9NumeroLote] = useState("");
  const [etapa9Ciclo, setEtapa9Ciclo] = useState("");
  const [etapa9DataEmissao, setEtapa9DataEmissao] = useState("");
  const [etapa10ModalOpen, setEtapa10ModalOpen] = useState(false);
  const [etapa10Loading, setEtapa10Loading] = useState(false);
  const [etapa10Saving, setEtapa10Saving] = useState(false);
  const [etapa10Error, setEtapa10Error] = useState<string | null>(null);
  const [etapa10NumeroNF, setEtapa10NumeroNF] = useState("");
  const [etapa10DataEmissao, setEtapa10DataEmissao] = useState("");
  const [etapa10Observacao, setEtapa10Observacao] = useState("");
  const [etapa9Observacao, setEtapa9Observacao] = useState("");
  const [etapa9Confirmado, setEtapa9Confirmado] = useState(false);
  const [etapa9ValorFinal, setEtapa9ValorFinal] = useState<number | null>(null);
  const [auditoriaModalOpen, setAuditoriaModalOpen] = useState(false);
  const [auditoriaLoading, setAuditoriaLoading] = useState(false);
  const [auditoriaError, setAuditoriaError] = useState<string | null>(null);
  const [auditoriaData, setAuditoriaData] = useState<AuditComparison | null>(null);
  const [retornoModalOpen, setRetornoModalOpen] = useState(false);
  const [retornoLoading, setRetornoLoading] = useState(false);
  const [retornoSaving, setRetornoSaving] = useState(false);
  const [retornoError, setRetornoError] = useState<string | null>(null);
  const [retornoRows, setRetornoRows] = useState<RetornoRow[]>([]);
  const [retornoEnviadoRows, setRetornoEnviadoRows] = useState<RetornoRow[]>([]);
  const [retornoModalidade, setRetornoModalidade] = useState<"LM" | "LV">("LM");
  const [retornoLoteId, setRetornoLoteId] = useState<string>("");
  const [retornoContexto, setRetornoContexto] = useState<OrcamentoPdfContext | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    modalidade: "",
    status: "",
    prioridade: "",
    municipio: "",
    endereco: "",
    encarregado: "",
    numero_os: "",
    data_abertura: "",
    data_despacho: "",
    data_execucao: "",
    observacao: "",
  });
  const [retornoResumo, setRetornoResumo] = useState<MaoDeObraResumo | null>(null);
  const availablePreviewModalities = useMemo(() => {
    return obterModalidadesDisponiveis(aprovacaoContextoPreview);
  }, [aprovacaoContextoPreview]);

  useEffect(() => {
    if (availablePreviewModalities.length === 0) return;
    if (!availablePreviewModalities.includes(aprovacaoPreviewModalidade)) {
      setAprovacaoPreviewModalidade(availablePreviewModalities[0]);
    }
  }, [availablePreviewModalities, aprovacaoPreviewModalidade]);
  type BookEmailAttachment = {
    name: string;
    data: string;
  };
  type BookFormType = {
    book_enviado_em: string;
    email_msg: string;
    email_attachment: BookEmailAttachment | null;
  };
  type BookFormField = Exclude<keyof BookFormType, "email_attachment">;
  const emptyBookForm: BookFormType = {
    book_enviado_em: "",
    email_msg: "",
    email_attachment: null,
  };
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSaving, setBookSaving] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookInfo, setBookInfo] = useState<string | null>(null);
  const [savingBookDitais, setSavingBookDitais] = useState(false);
  const [savingBookTrafo, setSavingBookTrafo] = useState(false);
  const [bookForm, setBookForm] = useState<BookFormType>({ ...emptyBookForm });
  const [bookEmailStorageEnabled, setBookEmailStorageEnabled] = useState(true);
  const emptyBookDitais = {
    data_execucao: "",
    numero_obra: "",
    regional: "METROPOLITANA",
    municipio: "",
    prestadora: "Engelétrica, Assessoria, Projetos e Construção",
    responsavel: "",
    fotos: {
      D: "",
      I: "",
      T: "",
      A: "",
      I2: "",
      S: "",
    },
    foto_modelo: "",
    observacao: "",
  };
  const [bookDitais, setBookDitais] = useState({ ...emptyBookDitais });
  type BookDitaisPhotoKey = keyof typeof emptyBookDitais["fotos"];
  const [bookTab, setBookTab] = useState<"book" | "ditais" | "trafo">("book");
  const [bookTrafoData, setBookTrafoData] = useState<any | null>(null);
  const photoInputRefs = useRef<Record<BookDitaisPhotoKey, HTMLInputElement | null>>({});
  const modeloInputRef = useRef<HTMLInputElement | null>(null);
  const bookAttachmentInputRef = useRef<HTMLInputElement | null>(null);

  const triggerPhotoUpload = (key: BookDitaisPhotoKey) => {
    photoInputRefs.current[key]?.click();
  };

  const triggerModeloUpload = () => {
    modeloInputRef.current?.click();
  };
  const hasBookTrafoInfo = (() => {
    if (!bookTrafoData) return false;
    const hasValue = (value: any) => {
      if (typeof value === "boolean") return value;
      if (typeof value === "number") return true;
      if (typeof value === "string" && value.trim().length > 0) return true;
      return false;
    };
    const keys = [
      bookTrafoData?.troca_transformador,
      bookTrafoData?.trafo_ret_marca,
      bookTrafoData?.trafo_ret_potencia,
      bookTrafoData?.trafo_ret_ano,
      bookTrafoData?.trafo_ret_tensao_primaria,
      bookTrafoData?.trafo_ret_tensao_secundaria,
      bookTrafoData?.trafo_ret_numero_serie,
      bookTrafoData?.trafo_ret_patrimonio,
      bookTrafoData?.trafo_inst_potencia,
      bookTrafoData?.trafo_inst_marca,
      bookTrafoData?.trafo_inst_ano,
      bookTrafoData?.trafo_inst_tensao_primaria,
      bookTrafoData?.trafo_inst_tensao_secundaria,
      bookTrafoData?.trafo_inst_numero_serie,
      bookTrafoData?.trafo_inst_patrimonio,
    ];
    return keys.some(hasValue);
  })();

  const getBookStorageKey = (suffix: string) => {
    const idAcionamento = selectedItem?.id_acionamento || selectedItem?.id;
    if (!idAcionamento) return null;
    return `book-${idAcionamento}-${suffix}`;
  };

  const handleBookDitaisFieldChange = (
    field: keyof Omit<typeof emptyBookDitais, "fotos">,
    value: string
  ) => {
    setBookDitais((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBookFormChange = (field: BookFormField, value: string) => {
    setBookForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBookEmailAttachmentUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBookForm((prev) => ({
        ...prev,
        email_attachment: {
          name: file.name,
          data: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const clearBookEmailAttachment = () => {
    setBookForm((prev) => ({
      ...prev,
      email_attachment: null,
    }));
    if (bookAttachmentInputRef.current) {
      bookAttachmentInputRef.current.value = "";
    }
  };

  const triggerBookEmailAttachmentUpload = () => {
    bookAttachmentInputRef.current?.click();
  };

  const handleBookDitaisPhotoChange = (key: BookDitaisPhotoKey, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBookDitais((prev) => ({
        ...prev,
        fotos: {
          ...prev.fotos,
          [key]: reader.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBookDitaisRemovePhoto = (key: BookDitaisPhotoKey) => {
    setBookDitais((prev) => ({
      ...prev,
      fotos: {
        ...prev.fotos,
        [key]: "",
      },
    }));
  };

  const initialTrafoPhotos = trafoPhotoSlots.reduce<Record<TrafoPhotoKey, string>>((acc, slot) => {
    acc[slot.key] = "";
    return acc;
  }, {} as Record<TrafoPhotoKey, string>);
  const [bookTrafoPhotos, setBookTrafoPhotos] = useState<Record<TrafoPhotoKey, string>>(initialTrafoPhotos);

  const handleTrafoPhotoChange = (key: TrafoPhotoKey, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBookTrafoPhotos((prev) => ({
        ...prev,
        [key]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleTrafoPhotoRemove = (key: TrafoPhotoKey) => {
    setBookTrafoPhotos((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const removedPhotoKeys = useMemo(
    () =>
      new Set([
        "trafo_retirado_frontal",
        "trafo_retirado_traseira",
        "trafo_retirado_lateral1",
        "trafo_retirado_lateral2",
        "trafo_retirado_superior",
        "placa_retirado",
        "para_raios_retirado",
        "aterramento_retirado",
        "foto_adicional_1",
        "foto_adicional_2",
      ]),
    []
  );
  const installedPhotoKeys = useMemo(
    () =>
      new Set([
        "trafo_instalado",
        "placa_instalada",
        "para_raios_instalado",
        "aterramento_instalado",
      ]),
    []
  );
  const trafoInputRefs = useRef<Record<TrafoPhotoKey, HTMLInputElement | null>>({});
  const triggerTrafoPhotoUpload = (key: TrafoPhotoKey) => {
    trafoInputRefs.current[key]?.click();
  };

  const chunkSlots = (slots: (typeof trafoPhotoSlots)[number][]) => {
    const rows: Array<(typeof trafoPhotoSlots)[number][]> = [];
    for (let i = 0; i < slots.length; i += 2) {
      rows.push(slots.slice(i, i + 2));
    }
    return rows;
  };
  const renderSlotRows = (slots: (typeof trafoPhotoSlots)[number][]) =>
    chunkSlots(slots).map((row, rowIndex) => (
      <div key={`trafo-row-${rowIndex}`} className="grid gap-4 sm:grid-cols-2">
          {row.map((slot) => {
            const photoValue = bookTrafoPhotos[slot.key];
            return (
              <div key={slot.key} className="rounded-xl border bg-card/80 p-3 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">{slot.label}</div>
                <div className="border border-dashed border-muted-foreground/40 rounded-md h-40 overflow-hidden bg-muted/20 flex items-center justify-center">
                  {photoValue ? (
                    <img src={photoValue} alt={slot.label} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem foto</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={(el) => {
                      trafoInputRefs.current[slot.key] = el;
                    }}
                    id={`trafo-photo-${slot.key}`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleTrafoPhotoChange(slot.key, file);
                      if (e.target) e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    type="button"
                    onClick={() => triggerTrafoPhotoUpload(slot.key)}
                  >
                    Enviar foto
                  </Button>
                  {photoValue && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleTrafoPhotoRemove(slot.key)}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    ));
  const generalTrafoSlots = useMemo(
    () => trafoPhotoSlots.filter((slot) => !removedPhotoKeys.has(slot.key) && !installedPhotoKeys.has(slot.key)),
    [installedPhotoKeys, removedPhotoKeys]
  );
  const removedTrafoSlots = useMemo(
    () => trafoPhotoSlots.filter((slot) => removedPhotoKeys.has(slot.key)),
    [removedPhotoKeys]
  );
  const installedTrafoSlots = useMemo(
    () => trafoPhotoSlots.filter((slot) => installedPhotoKeys.has(slot.key)),
    [installedPhotoKeys]
  );
  const handleExportBookTrafo = async () => {
    if (!bookTrafoData && !selectedItem) {
      setBookError("Dados de transformador indisponíveis.");
      return;
    }
    setBookError(null);
    setBookInfo(null);
    try {
      await exportTrafoBookToExcel({
        selectedItem,
        bookTrafoData,
        photos: bookTrafoPhotos,
      });
      setBookInfo("Planilha de trafo gerada com sucesso.");
    } catch (error: any) {
      setBookError(error?.message || "Erro ao exportar o modelo de trafo.");
    }
  };

  const handleExportBookDitais = async () => {
    setBookError(null);
    setBookInfo(null);
    try {
      await exportBookToExcel({
        data_execucao:
          typeof bookDitais.data_execucao === "string"
            ? formatDateTimeBr(bookDitais.data_execucao)
            : bookDitais.data_execucao,
        numero_obra: bookDitais.numero_obra,
        regional: bookDitais.regional,
        municipio: bookDitais.municipio,
        prestadora: bookDitais.prestadora,
        responsavel: bookDitais.responsavel,
        foto_modelo: bookDitais.foto_modelo,
        observacao: bookDitais.observacao,
        fotos: bookDitais.fotos,
      });
      setBookInfo("Planilha de DITAIS gerada com sucesso. Verifique seus downloads.");
    } catch (error: any) {
      setBookError(error?.message || "Erro ao exportar os DITAIS.");
    }
  };

  const handleSaveBookDitais = () => {
    const storageKey = getBookStorageKey("ditais");
    if (!storageKey) {
      setBookError("ID do acionamento não encontrado.");
      return;
    }
    setSavingBookDitais(true);
    setBookError(null);
    setBookInfo(null);
    try {
      const storage =
        typeof window !== "undefined" ? window.localStorage : null;
      if (!storage) throw new Error("Armazenamento local indisponível.");
      storage.setItem(storageKey, JSON.stringify(bookDitais));
      setBookInfo("Informações dos DITAIS salvas localmente.");
    } catch (error: any) {
      setBookError(error?.message || "Erro ao salvar os DITAIS.");
    } finally {
      setSavingBookDitais(false);
    }
  };

  const handleSaveBookTrafo = () => {
    const storageKey = getBookStorageKey("trafo-photos");
    if (!storageKey) {
      setBookError("ID do acionamento não encontrado.");
      return;
    }
    setSavingBookTrafo(true);
    setBookError(null);
    setBookInfo(null);
    try {
      const storage =
        typeof window !== "undefined" ? window.localStorage : null;
      if (!storage) throw new Error("Armazenamento local indisponível.");
      storage.setItem(storageKey, JSON.stringify(bookTrafoPhotos));
      setBookInfo("Fotos do trafo salvas localmente.");
    } catch (error: any) {
      setBookError(error?.message || "Erro ao salvar as fotos do trafo.");
    } finally {
      setSavingBookTrafo(false);
    }
  };

  const ditaisFields: Array<{ label: string; field: keyof Omit<typeof emptyBookDitais, "fotos"> }> = [
    { label: "Data execução", field: "data_execucao" },
    { label: "Nº da obra", field: "numero_obra" },
    { label: "Regional", field: "regional" },
    { label: "Município", field: "municipio" },
    { label: "Prestadora", field: "prestadora" },
    { label: "Responsável", field: "responsavel" },
  ];

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
  const [savingMedicao, setSavingMedicao] = useState(false);
  const [advancingEtapa4, setAdvancingEtapa4] = useState(false);
  const [pdfGeradoPorModalidade, setPdfGeradoPorModalidade] = useState<Record<"LM" | "LV", boolean>>({
    LM: false,
    LV: false,
  });
  const [ultimoPdfGeradoEm, setUltimoPdfGeradoEm] = useState<string | null>(null);
  const [medicaoDetalhesAcionamento, setMedicaoDetalhesAcionamento] = useState<any | null>(null);
  const [medicaoEquipeSelecionada, setMedicaoEquipeSelecionada] = useState<Record<EquipeLinha, string>>({
    LM: "",
    LV: "",
  });
  const [medicaoEquipeOpcoes, setMedicaoEquipeOpcoes] = useState<Record<EquipeLinha, { value: string; label: string }[]>>({
    LM: [],
    LV: [],
  });
  const [medicaoEquipeMetaPorCodigo, setMedicaoEquipeMetaPorCodigo] = useState<Record<string, EquipeEntry>>({});

  const atualizarEquipeSelecionada = (linha: EquipeLinha, codigo: string) => {
    setMedicaoEquipeSelecionada((prev) => ({
      ...prev,
      [linha]: codigo,
    }));
  };

  const equipeValidaParaLinha = (linha: EquipeLinha) => {
    const codigo = medicaoEquipeSelecionada[linha];
    if (!codigo) return false;
    const info = medicaoEquipeMetaPorCodigo[codigo];
    return !!info && info.linha === linha;
  };

  const modalidadeSelecionada = (selectedItem?.modalidade || "LM").toUpperCase();
  const modalSuportaLM = modalidadeSelecionada !== "LV";
  const modalSuportaLV = modalidadeSelecionada !== "LM";
  const pdfGeracaoIndisponivel =
    savingMedicao ||
    (medicaoEquipeOpcoes[medicaoTab]?.length || 0) === 0 ||
    !equipeValidaParaLinha(medicaoTab);
  const etapaAtualSelecionada = Number(selectedItem?.etapa_atual || 0);
  const etapa4Liberada = etapaAtualSelecionada >= 4;
  const possuiItensLM = (medicaoItens.LM || []).length > 0;
  const possuiItensLV = (medicaoItens.LV || []).length > 0;
  const pendenciaPdfLM = possuiItensLM && !pdfGeradoPorModalidade.LM;
  const pendenciaPdfLV = possuiItensLV && !pdfGeradoPorModalidade.LV;
  const pendenciaPdf = pendenciaPdfLM || pendenciaPdfLV;
  const pendenciaPdfDescricao = (() => {
    if (!pendenciaPdf) return "";
    const faltantes = [
      pendenciaPdfLM ? "Linha Morta" : null,
      pendenciaPdfLV ? "Linha Viva" : null,
    ].filter(Boolean);
    return faltantes.join(" e ");
  })();
  const podeConcluirEtapa3 =
    !etapa4Liberada && !advancingEtapa4 && !pdfGeracaoIndisponivel && !pendenciaPdf;
  const osAcionamentoCodigo =
    selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--";
  const osElementoDisplay = osElementoId || selectedItem?.elemento_id || "--";

  const emptyExec = {

    km_inicial: "",

    km_final: "",

    km_total: "",

    saida_base: "",

    inicio_servico: "",

    retorno_servico: "",

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

  }

  const [execForm, setExecForm] = useState<any>(emptyExec);

  const toInputDateTime = (value?: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    // datetime-local expects yyyy-MM-ddTHH:mm
    return d.toISOString().slice(0, 16);
  };

  const fromInputDateTime = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
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

  useEffect(() => {
    if (!bookModalOpen || !selectedItem) return;

    const baseDitais = {
      ...emptyBookDitais,
      data_execucao:
        toInputDateTime(selectedItem.data_execucao || selectedItem.data_abertura) ||
        emptyBookDitais.data_execucao,
      numero_obra: `AC${selectedItem.codigo_acionamento || selectedItem.id_acionamento || ""}`.trim() || "",
      municipio: selectedItem.municipio || "",
      responsavel: selectedItem.encarregado || "",
      regional: "METROPOLITANA",
    };

    const storage =
      typeof window !== "undefined" ? window.localStorage : null;
    const ditaisStorageKey = getBookStorageKey("ditais");
    let mergedDitais = baseDitais;

    if (storage && ditaisStorageKey) {
      const savedData = storage.getItem(ditaisStorageKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed && typeof parsed === "object") {
            const { fotos: savedFotos, ...rest } = parsed;
            mergedDitais = {
              ...mergedDitais,
              ...rest,
              fotos:
                savedFotos && typeof savedFotos === "object"
                  ? { ...mergedDitais.fotos, ...savedFotos }
                  : mergedDitais.fotos,
            };
          }
        } catch (error) {
          console.warn("Não foi possível restaurar dados salvos dos DITAIS.", error);
        }
      }
    }

    setBookDitais(mergedDitais);

    const trafoStorageKey = getBookStorageKey("trafo-photos");
    const initialPhotos = initialTrafoPhotos;
    let nextTrafoPhotos = initialPhotos;

    if (storage && trafoStorageKey) {
      const savedPhotos = storage.getItem(trafoStorageKey);
      if (savedPhotos) {
        try {
          const parsed = JSON.parse(savedPhotos);
          if (parsed && typeof parsed === "object") {
            nextTrafoPhotos = { ...initialPhotos, ...parsed };
          }
        } catch (error) {
          console.warn("Não foi possível restaurar fotos salvas do trafo.", error);
        }
      }
    }

    setBookTrafoPhotos(nextTrafoPhotos);
  }, [bookModalOpen, selectedItem]);

  const openMedicaoModal = async (item: any) => {
    setSelectedItem(item);
    const idAcionamento = item.id_acionamento || item.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado para medição.");
      return;
    }

    const mod = (item.modalidade || "LM").toUpperCase();
    const initialTab: "LM" | "LV" = mod === "LM+LV" ? "LM" : (mod as "LM" | "LV");
    setMedicaoTab(initialTab);
    setMedicaoItens({ LM: [], LV: [] });
    setMedicaoForaHC(false);
    setMedicaoDetalhesAcionamento(null);
    setMedicaoEquipeSelecionada({ LM: "", LV: "" });
    setMedicaoEquipeOpcoes({ LM: [], LV: [] });
    setMedicaoEquipeMetaPorCodigo({});
    setPdfGeradoPorModalidade({ LM: false, LV: false });
    setUltimoPdfGeradoEm(null);
    setMedicaoModalOpen(true);

    let detalhesAcionamento: any = null;
    try {
      const { data } = await supabase
        .from("acionamentos")
        .select("*")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (data) {
        detalhesAcionamento = data;
        setMedicaoDetalhesAcionamento(data);
      }
    } catch (err) {
      console.warn("Falha ao carregar detalhes do acionamento para a medição", err);
    }

    let equipesRelacionadas: { id_equipe?: string | null; papel?: string | null; encarregado_nome?: string | null }[] = [];
    try {
      const { data } = await supabase
        .from("acionamento_equipes")
        .select("id_equipe,papel,encarregado_nome")
        .eq("id_acionamento", idAcionamento);
      equipesRelacionadas = data || [];
    } catch (err) {
      console.warn("Falha ao carregar equipes relacionadas para sugestão", err);
    }

    type EquipeMeta = { original: string; linha?: EquipeLinha; encarregado?: string | null };
    const equipeMetaMap = new Map<string, EquipeMeta>();
    const registrarCodigo = (valor?: string | null, linhaHint?: EquipeLinha, encarregado?: string | null) => {
      if (!valor) return undefined;
      const texto = String(valor).trim();
      if (!texto) return undefined;
      const key = texto.toUpperCase();
      const existente = equipeMetaMap.get(key) || { original: texto };
      if (linhaHint && !existente.linha) existente.linha = linhaHint;
      if (encarregado && encarregado.trim() && !existente.encarregado) existente.encarregado = encarregado.trim();
      equipeMetaMap.set(key, existente);
      return key;
    };

    const preferenciaNomeLM = [
      detalhesAcionamento?.encarregado_lm,
      item?.encarregado_lm,
      detalhesAcionamento?.encarregado,
      item?.encarregado,
      detalhesAcionamento?.encarregado_nome,
      item?.encarregado_nome,
    ].find((nome) => typeof nome === "string" && nome.trim().length > 0);

    const preferenciaNomeLV = [
      detalhesAcionamento?.encarregado_lv,
      item?.encarregado_lv,
      detalhesAcionamento?.encarregado,
      item?.encarregado,
      detalhesAcionamento?.encarregado_nome,
      item?.encarregado_nome,
    ].find((nome) => typeof nome === "string" && nome.trim().length > 0);

    registrarCodigo(detalhesAcionamento?.equipe_lm, "LM", preferenciaNomeLM);
    registrarCodigo(item?.equipe_lm, "LM", preferenciaNomeLM);
    registrarCodigo(detalhesAcionamento?.equipe_lv, "LV", preferenciaNomeLV);
    registrarCodigo(item?.equipe_lv, "LV", preferenciaNomeLV);
    registrarCodigo(detalhesAcionamento?.codigo_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(item?.codigo_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(detalhesAcionamento?.equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(item?.equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(detalhesAcionamento?.id_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(item?.id_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(detalhesAcionamento?.nome_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);
    registrarCodigo(item?.nome_equipe, undefined, preferenciaNomeLM || preferenciaNomeLV);

    equipesRelacionadas.forEach((rel) => {
      registrarCodigo(rel?.id_equipe, normalizeLinha(rel?.papel), rel?.encarregado_nome);
    });

    let equipesDbMap = new Map<string, { nome_equipe?: string | null; linha?: string | null }>();
    const uuidRefs = Array.from(equipeMetaMap.values())
      .map((meta) => meta.original)
      .filter((valor) => isUuidValue(valor));
    if (uuidRefs.length > 0) {
      try {
        const { data } = await supabase
          .from("equipes")
          .select("id_equipe,nome_equipe,linha")
          .in("id_equipe", uuidRefs);
        equipesDbMap = new Map(
          (data || []).map((eq: any) => [String(eq.id_equipe || "").toUpperCase(), eq])
        );
      } catch (err) {
        console.warn("Falha ao carregar nomes das equipes relacionadas", err);
      }
    }

    const opcoesPorLinha: Record<EquipeLinha, { value: string; label: string }[]> = {
      LM: [],
      LV: [],
    };
    const metaPorCodigo: Record<string, EquipeEntry> = {};

    equipeMetaMap.forEach((meta, key) => {
      const original = meta.original;
      const registroDb = isUuidValue(original) ? equipesDbMap.get(key) : undefined;
      const nomeBase = registroDb?.nome_equipe?.trim() || original;
      const linhaInferida =
        meta.linha ||
        normalizeLinha(registroDb?.linha) ||
        inferLinhaPorCodigo(nomeBase) ||
        inferLinhaPorCodigo(original) ||
        inferLinhaPorEncarregado(meta.encarregado);
      if (!linhaInferida) return;
      const label = meta.encarregado?.trim()
        ? `${nomeBase} - ${meta.encarregado.trim()}`
        : nomeBase;
      opcoesPorLinha[linhaInferida].push({ value: original, label });
      metaPorCodigo[original] = { nome: label, linha: linhaInferida, encarregado: meta.encarregado?.trim() };
    });

    setMedicaoEquipeOpcoes(opcoesPorLinha);
    setMedicaoEquipeMetaPorCodigo(metaPorCodigo);

    const fontesSugestao = [detalhesAcionamento, item, ...equipesRelacionadas];
    const codigosDisponiveis = Object.values(opcoesPorLinha)
      .flat()
      .map((opt) => opt.value);
    const sugestaoLM = inferirEquipePreferencial("LM", fontesSugestao, codigosDisponiveis);
    const sugestaoLV = inferirEquipePreferencial("LV", fontesSugestao, codigosDisponiveis);

    const modSuportaLM = mod !== "LV";
    const modSuportaLV = mod !== "LM";
    const selecionarValorDisponivel = (
      linha: EquipeLinha,
      preferencia?: string
    ): string => {
      if (!((linha === "LM" && modSuportaLM) || (linha === "LV" && modSuportaLV))) {
        return "";
      }
      const opcoes = opcoesPorLinha[linha];
      if (opcoes.length === 0) return "";
      if (preferencia) {
        const match = opcoes.find(
          (opt) => opt.value.toUpperCase() === preferencia.toUpperCase()
        );
        if (match) return match.value;
      }
      return opcoes[0].value;
    };

    setMedicaoEquipeSelecionada({
      LM: selecionarValorDisponivel("LM", sugestaoLM),
      LV: selecionarValorDisponivel("LV", sugestaoLV),
    });
    
    // Carrega valores UPS em reais das configuraçães
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
        .eq("id_acionamento", idAcionamento)
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
        .eq("id_acionamento", idAcionamento)
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

    try {
      const { data: rascunho } = await supabase
        .from("medicao_orcamentos")
        .select("itens_lm,itens_lv,fora_horario,valor_ups_lm,valor_ups_lv")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (rascunho) {
        setMedicaoItens({
          LM: Array.isArray(rascunho.itens_lm) ? rascunho.itens_lm : [],
          LV: Array.isArray(rascunho.itens_lv) ? rascunho.itens_lv : [],
        });
        setMedicaoForaHC(Boolean(rascunho.fora_horario));
        if (rascunho.valor_ups_lm) {
          setMedicaoValorUpsLM(Number(rascunho.valor_ups_lm));
        }
        if (rascunho.valor_ups_lv) {
          setMedicaoValorUpsLV(Number(rascunho.valor_ups_lv));
        }
      }
    } catch (err) {
      console.warn("Falha ao carregar rascunho da medição", err);
    }
  };

  const aplicarPercentualFinal = (valorBase: number, foraHorario?: boolean) => {
    if (!valorBase) return 0;
    const fora = typeof foraHorario === "boolean" ? foraHorario : medicaoForaHC;
    const percentual = fora ? 0.3 : 0.12;
    return valorBase * (1 + percentual);
  };

  const calcularSubtotalItem = (item: any, tabKey: "LM" | "LV") => {
    if (!item) return 0;
    const upsQtd = Number(item.valorUps ?? item.ups ?? 0);
    const valorConfig = tabKey === "LM" ? medicaoValorUpsLM : medicaoValorUpsLV;
    const quantidade = Number(item.quantidade) || 0;
    return quantidade * upsQtd * valorConfig;
  };

  const subtotalMedicao = (item: any) => {
    return calcularSubtotalItem(item, medicaoTab);
  };

  const totalBaseMedicao = (tabKey: "LM" | "LV") => {
    const itens = medicaoItens[tabKey] || [];
    return itens.reduce((acc, i) => acc + calcularSubtotalItem(i, tabKey), 0);
  };

  const totalAbaMedicao = (tabKey: "LM" | "LV") => {
    const base = totalBaseMedicao(tabKey);
    return aplicarPercentualFinal(base);
  };

  const handleAddMedicaoItem = (itemCatalogo: any) => {
    const tabDestino: "LM" | "LV" = ((itemCatalogo?.tipo || medicaoTab || "LM").toUpperCase() === "LV" ? "LV" : "LM");
    const codigo = itemCatalogo?.codigo_mao_de_obra || itemCatalogo?.codigo || "";
    const valorUps = Number(itemCatalogo?.ups ?? itemCatalogo?.valorUps ?? 0);
    setMedicaoItens((prev) => {
      const copia = { ...prev };
      const lista = [...(copia[tabDestino] || [])];
      const idx = lista.findIndex((i) => i.codigo === codigo && i.operacao === itemCatalogo?.operacao);
      if (idx >= 0) {
        const atual = { ...lista[idx] };
        atual.quantidade = Number(atual.quantidade || 0) + 1;
        lista[idx] = atual;
      } else {
        lista.push({
          codigo,
          descricao: itemCatalogo?.descricao || "",
          unidade: itemCatalogo?.unidade || "UN",
          valorUps,
          quantidade: 1,
          operacao: itemCatalogo?.operacao || "",
          tipo: tabDestino,
        });
      }
      copia[tabDestino] = lista;
      return copia;
    });
  };

  const handleRemoveMedicao = (codigo: string, operacao?: string) => {
    setMedicaoItens((prev) => {
      const copia = { ...prev };
      copia[medicaoTab] = (copia[medicaoTab] || []).filter(
        (i) => !(i.codigo === codigo && (i.operacao || "") === (operacao || ""))
      );
      return copia;
    });
  };

  const handleQtdMedicao = (codigo: string, operacao: string | undefined, quantidade: number) => {
    const valorNormalizado = quantidade > 0 ? quantidade : 0;
    setMedicaoItens((prev) => {
      const copia = { ...prev };
      copia[medicaoTab] = (copia[medicaoTab] || []).map((i) => {
        if (i.codigo === codigo && (i.operacao || "") === (operacao || "")) {
          return { ...i, quantidade: valorNormalizado };
        }
        return i;
      });
      return copia;
    });
  };

  const salvarMedicao = async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!selectedItem) {
      alert("Nenhum acionamento selecionado.");
      return false;
    }

    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado.");
      return false;
    }

    const itensLM = medicaoItens.LM || [];
    const itensLV = medicaoItens.LV || [];
    if (itensLM.length === 0 && itensLV.length === 0) {
      alert("Adicione ao menos um item antes de salvar o rascunho.");
      return false;
    }

    const baseLM = totalBaseMedicao("LM");
    const baseLV = totalBaseMedicao("LV");
    const payload = {
      id_acionamento: idAcionamento,
      itens_lm: itensLM,
      itens_lv: itensLV,
      fora_horario: medicaoForaHC,
      valor_ups_lm: medicaoValorUpsLM,
      valor_ups_lv: medicaoValorUpsLV,
      total_base_lm: baseLM,
      total_base_lv: baseLV,
      total_final_lm: aplicarPercentualFinal(baseLM),
      total_final_lv: aplicarPercentualFinal(baseLV),
      atualizado_por: currentUserId,
      atualizado_em: new Date().toISOString(),
    };

    setSavingMedicao(true);
    try {
      const { error } = await supabase
        .from("medicao_orcamentos")
        .upsert(payload, { onConflict: "id_acionamento" });
      if (error) throw error;
      if (!options?.silent) {
        alert(" Rascunho salvo com sucesso!");
      }
      return true;
    } catch (err: any) {
      console.error("Erro ao salvar medição", err);
      alert(`Erro ao salvar medição: ${err?.message || err}`);
      return false;
    } finally {
      setSavingMedicao(false);
    }
  };

  const avancarParaEtapa4 = async () => {
    if (!selectedItem) {
      alert("Nenhum acionamento selecionado.");
      return;
    }
    if (etapa4Liberada) {
      alert("Atenção: Este acionamento jí estí na Etapa 4 ou posterior.");
      return;
    }
    if (pendenciaPdf) {
      const descricao = pendenciaPdfDescricao || "mão de obra";
      alert(`Gere o PDF dos itens de ${descricao} antes de concluir a etapa.`);
      return;
    }

    const salvou = await salvarMedicao({ silent: true });
    if (!salvou) return;

    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado.");
      return;
    }

    setAdvancingEtapa4(true);
    try {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from("acionamentos")
        .update({ etapa_atual: 4, medicao_registrada_em: agora })
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) =>
        prev
          ? {
              ...prev,
              etapa_atual: 4,
              medicao_registrada_em: agora,
            }
          : prev
      );
      setItems((prev) => prev.filter((item) => item.id_acionamento !== idAcionamento));
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 3) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          if (step.id === 4) {
            return { ...step, count: step.count + 1 };
          }
          return step;
        })
      );
      alert("Etapa avançada para 4. Registre a OS no sistema.");
    } catch (err: any) {
      console.error("Erro ao avançar etapa", err);
      alert(`Erro ao avançar etapa: ${err?.message || err}`);
    } finally {
      setAdvancingEtapa4(false);
    }
  };

  const prepararOrcamentoContext = async (
    idAcionamento: string,
    pdfModalidade: "LM" | "LV",
    selectedSnapshot?: any,
    medicaoRascunho?: MedicaoRascunho
  ): Promise<OrcamentoPdfContext | null> => {
    const snapshotItem = selectedSnapshot || selectedItem;
    if (!snapshotItem) return null;

    let dadosExec: any = null;
    try {
      const { data } = await supabase
        .from("acionamento_execucao")
        .select("*")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      dadosExec = data;
    } catch (err) {
      console.warn("Dados de execução não encontrados");
    }

    let detalhesAcionamento: any =
      medicaoDetalhesAcionamento && medicaoDetalhesAcionamento.id_acionamento === idAcionamento
        ? medicaoDetalhesAcionamento
        : null;
    if (!detalhesAcionamento) {
      try {
        const { data } = await supabase
          .from("acionamentos")
          .select("*")
          .eq("id_acionamento", idAcionamento)
          .maybeSingle();
        detalhesAcionamento = data;
      } catch (err) {
        console.warn("Detalhes do acionamento não encontrados");
      }
    }

    let equipesRelacionadas: { id_equipe?: string | null; papel?: string | null; encarregado_nome?: string | null }[] = [];
    try {
      const { data } = await supabase
        .from("acionamento_equipes")
        .select("id_equipe,papel,encarregado_nome")
        .eq("id_acionamento", idAcionamento);
      equipesRelacionadas = data || [];
    } catch (err) {
      console.warn("Equipes adicionais não encontradas", err);
    }

    const rawEquipeRefs = new Set<string>();
    const registrarEquipe = (valor?: string | null) => {
      if (!valor) return;
      const texto = String(valor).trim();
      if (!texto) return;
      rawEquipeRefs.add(texto);
    };

    registrarEquipe(detalhesAcionamento?.id_equipe);
    registrarEquipe(detalhesAcionamento?.codigo_equipe);
    registrarEquipe(detalhesAcionamento?.equipe);
    registrarEquipe(detalhesAcionamento?.equipe_lm);
    registrarEquipe(detalhesAcionamento?.nome_equipe);
    registrarEquipe((snapshotItem as any)?.id_equipe);
    registrarEquipe((snapshotItem as any)?.equipe);
    registrarEquipe((snapshotItem as any)?.equipe_lm);
    equipesRelacionadas.forEach((rel) => registrarEquipe(rel?.id_equipe));

    const equipeCodigos = new Set<string>();
    const equipeUuids = new Set<string>();
    rawEquipeRefs.forEach((valor) => {
      if (isUuidValue(valor)) {
        equipeUuids.add(valor);
      } else {
        equipeCodigos.add(valor.toUpperCase());
      }
    });

    const equipeCatalogo = new Map<string, { nome: string; linha?: "LM" | "LV" }>();
    equipeCodigos.forEach((codigo) => {
      const info = getEquipeInfoByCodigo(codigo);
      if (info) {
        equipeCatalogo.set(codigo, info);
      } else {
        equipeCatalogo.set(codigo, { nome: codigo });
      }
    });

    if (equipeUuids.size > 0) {
      try {
        const { data } = await supabase
          .from("equipes")
          .select("id_equipe,nome_equipe,linha")
          .in("id_equipe", Array.from(equipeUuids));
        (data || []).forEach((eq: any) => {
          const nome = eq?.nome_equipe || String(eq?.id_equipe || "");
          equipeCatalogo.set(String(eq.id_equipe), {
            nome,
            linha:
              normalizeLinha(eq?.linha) || inferLinhaPorCodigo(nome) || inferLinhaPorEncarregado(eq?.encarregado_nome),
          });
        });
      } catch (err) {
        console.warn("Nomes das equipes não encontrados", err);
      }
    }

    const obterInfoEquipe = (valor?: string | null, encarregado?: string | null) => {
      if (valor) {
        const texto = valor.trim();
        if (texto) {
          const info =
            equipeCatalogo.get(texto) ||
            equipeCatalogo.get(texto.toUpperCase()) ||
            equipeCatalogo.get(texto.toLowerCase());
          if (info) {
            return info;
          }
        }
      }
      if (encarregado) {
        const deducao = inferEquipePorEncarregado(encarregado);
        if (deducao) {
          return (
            equipeCatalogo.get(deducao.codigo) || {
              nome: deducao.codigo,
              linha: deducao.linha,
            }
          );
        }
      }
      return undefined;
    };

    const headerBase = {
      ...(snapshotItem || {}),
      ...(detalhesAcionamento || {}),
      modalidade: pdfModalidade,
    };

    const dataExecucaoFonte = pickValue(
      dadosExec?.inicio_servico,
      headerBase.data_execucao,
      headerBase.data_execucao_lm,
      headerBase.data_despacho,
      headerBase.data_abertura
    );
    const dataExecucaoTexto = formatDateTimeBr(dataExecucaoFonte);
    const codigoAcionamento = headerBase.codigo_acionamento || "--";
    const numeroSigod = pickValue(
      dadosExec?.numero_intervencao,
      headerBase.numero_intervencao,
      headerBase.numero_os
    );
    const numeroSs = pickValue(dadosExec?.ss_nota, headerBase.ss_nota);
    const numeroIntervencaoTexto =
      [numeroSigod ? `SIGOD: ${numeroSigod}` : null, numeroSs ? `SS: ${numeroSs}` : null]
        .filter(Boolean)
        .join(" | ") || "--";

    const equipeEntries: EquipeEntry[] = [];
    const adicionarEntradaEquipe = (
      valor?: string | null,
      linhaSugestao?: "LM" | "LV",
      encarregadoRelacionado?: string | null
    ) => {
      if (!valor && !encarregadoRelacionado) return;
      const info = obterInfoEquipe(valor, encarregadoRelacionado);
      if (info?.nome) {
        equipeEntries.push({ nome: info.nome, linha: info.linha || linhaSugestao, encarregado: encarregadoRelacionado });
        return;
      }
      const texto = valor?.trim() || "";
      if (!texto || isUuidValue(texto)) return;
      equipeEntries.push({ nome: texto, linha: linhaSugestao, encarregado: encarregadoRelacionado });
    };

    const principalLinhaInferida =
      inferLinhaPorCodigo(detalhesAcionamento?.codigo_equipe) ||
      inferLinhaPorCodigo(detalhesAcionamento?.equipe_lm) ||
      inferLinhaPorEncarregado(
        detalhesAcionamento?.encarregado_lm ||
          detalhesAcionamento?.encarregado ||
          headerBase.encarregado_lm ||
          headerBase.encarregado
      );

    const encarregadoPrincipal =
      detalhesAcionamento?.encarregado_lm ||
      detalhesAcionamento?.encarregado ||
      headerBase.encarregado_lm ||
      headerBase.encarregado;

    adicionarEntradaEquipe(detalhesAcionamento?.id_equipe, principalLinhaInferida, encarregadoPrincipal);
    adicionarEntradaEquipe(detalhesAcionamento?.codigo_equipe, principalLinhaInferida, encarregadoPrincipal);
    adicionarEntradaEquipe(detalhesAcionamento?.equipe_lm, principalLinhaInferida, encarregadoPrincipal);

    equipesRelacionadas.forEach((rel) => {
      const linhaRel =
        normalizeLinha(rel?.papel) || inferLinhaPorCodigo(rel?.id_equipe) || inferLinhaPorEncarregado(rel?.encarregado_nome);
      adicionarEntradaEquipe(rel?.id_equipe, linhaRel, rel?.encarregado_nome || encarregadoPrincipal);
    });

    const uniqueEquipes = equipeEntries.filter((item, index, arr) => {
      const key = `${item.nome}::${item.linha || ""}`;
      return arr.findIndex((target) => `${target.nome}::${target.linha || ""}` === key) === index;
    });

    const preferenciaLinha = pdfModalidade === "LM" ? "LM" : pdfModalidade === "LV" ? "LV" : undefined;
    const preferidas =
      preferenciaLinha != null
        ? uniqueEquipes.filter((eq) => eq.linha === preferenciaLinha)
        : uniqueEquipes;
    const equipesParaMostrar =
      preferidas.length > 0 ? preferidas : uniqueEquipes.length > 0 ? uniqueEquipes : [];

    const equipeSelecionadaCodigo = medicaoEquipeSelecionada[pdfModalidade];
    const equipeSelecionadaInfo = equipeSelecionadaCodigo
      ? medicaoEquipeMetaPorCodigo[equipeSelecionadaCodigo] ||
        getEquipeInfoByCodigo(equipeSelecionadaCodigo) || {
          nome: equipeSelecionadaCodigo,
          linha: inferLinhaPorCodigo(equipeSelecionadaCodigo),
        }
      : undefined;
    const equipeSelecionadaLinha =
      equipeSelecionadaInfo?.linha || inferLinhaPorCodigo(equipeSelecionadaCodigo);
    const equipeSelecionadaEncarregado = equipeSelecionadaInfo?.encarregado?.trim();
    const equipeListaTexto = equipesParaMostrar
      .map((eq) => formatEquipeDisplay(eq, pdfModalidade))
      .join(" | ");

    const formatarCampoEquipe = (valor?: string | null, encarregadoFallback?: string | null) => {
      const info = obterInfoEquipe(valor, encarregadoFallback || encarregadoPrincipal);
      if (info) {
        return formatEquipeDisplay(info, pdfModalidade);
      }
      if (!valor) return undefined;
      const texto = valor.trim();
      if (!texto || isUuidValue(texto)) return undefined;
      return texto;
    };

    let equipeTexto =
      pickValue(
        equipeListaTexto,
        formatarCampoEquipe(headerBase.equipe),
        formatarCampoEquipe(headerBase.equipe_nome),
        formatarCampoEquipe(headerBase.nome_equipe),
        formatarCampoEquipe(headerBase.equipe_lm),
        formatarCampoEquipe(headerBase.codigo_equipe)
      ) || "--";

    if (equipeSelecionadaCodigo) {
      const manualLabel = formatEquipeDisplay(equipeSelecionadaInfo, pdfModalidade);
      if (manualLabel) {
        equipeTexto = manualLabel;
      }
    }

    const getEncarregadoByLinha = (linha?: "LM" | "LV") => {
      if (!linha) return undefined;
      if (equipeSelecionadaLinha === linha && equipeSelecionadaEncarregado) {
        return equipeSelecionadaEncarregado;
      }
      const relMatch = equipesRelacionadas.find(
        (rel) => normalizeLinha(rel?.papel) === linha && (rel?.encarregado_nome || "").trim()
      );
      if (relMatch?.encarregado_nome) {
        return relMatch.encarregado_nome.trim();
      }
      const entryMatch = uniqueEquipes.find(
        (eq) => eq.linha === linha && (eq.encarregado || "").trim().length > 0
      );
      if (entryMatch?.encarregado) {
        return entryMatch.encarregado.trim();
      }
      if (linha === principalLinhaInferida && (encarregadoPrincipal || "").trim()) {
        return (encarregadoPrincipal || "").trim();
      }
      return undefined;
    };

    const encarregadoLinhaLM = getEncarregadoByLinha("LM");
    const encarregadoLinhaLV = getEncarregadoByLinha("LV");
    const encarregadoManualLinha = equipeSelecionadaLinha === pdfModalidade ? equipeSelecionadaEncarregado : undefined;
    const encarregadoPreferencias =
      pdfModalidade === "LV"
        ? [encarregadoLinhaLV, headerBase.encarregado_lv, headerBase.encarregado, headerBase.encarregado_nome]
        : [encarregadoLinhaLM, headerBase.encarregado_lm, headerBase.encarregado, headerBase.encarregado_nome];
    const encarregadoTexto =
      pickValue(
        encarregadoManualLinha,
        ...encarregadoPreferencias,
        encarregadoSelecionado,
        encarregadoNome
      ) || "--";
    const tecnicoTexto =
      pickValue(
        headerBase.tecnico,
        headerBase.tecnico_responsavel,
        headerBase.tecnico_nome,
        currentUserName
      ) || "--";
    const enderecoTexto = (() => {
      const direto = pickValue(headerBase.endereco, headerBase.endereco_completo);
      if (direto) return direto;
      const partes = [
        headerBase.logradouro,
        headerBase.numero,
        headerBase.bairro,
        headerBase.municipio || headerBase.cidade,
        headerBase.uf,
      ]
        .filter((parte) => typeof parte === "string" && parte.trim().length > 0)
        .join(", ");
      return partes || "--";
    })();
    const alimentadorTexto = pickValue(dadosExec?.alimentador, headerBase.alimentador) || "--";
    const subestacaoTexto = pickValue(dadosExec?.subestacao, headerBase.subestacao) || "--";
    const alimentadorSubTexto = `${alimentadorTexto} / ${subestacaoTexto}`;
    const osTabletTexto = pickValue(dadosExec?.os_tablet, headerBase.os_tablet) || "--";
    const itensLM = medicaoRascunho?.itens_lm ?? medicaoItens.LM;
    const itensLV = medicaoRascunho?.itens_lv ?? medicaoItens.LV;
    const valorUpsLM = medicaoRascunho?.valor_ups_lm ?? medicaoValorUpsLM;
    const valorUpsLV = medicaoRascunho?.valor_ups_lv ?? medicaoValorUpsLV;
    const foraHorario = medicaoRascunho?.fora_horario ?? medicaoForaHC;
    const medicaoItensSnapshotLocal = {
      LM: [...(itensLM || [])],
      LV: [...(itensLV || [])],
    };
    const itensMO = (pdfModalidade === "LM" ? itensLM || [] : itensLV || []).map((item) => ({ ...item }));

    return {
      idAcionamento,
      pdfModalidade,
      selectedItemSnapshot: { ...snapshotItem },
      dadosExec,
      detalhesAcionamento,
      headerBase,
      numeroIntervencaoTexto,
      dataExecucaoTexto,
      codigoAcionamento,
      equipeTexto,
      encarregadoTexto,
      tecnicoTexto,
      enderecoTexto,
      alimentadorTexto,
      subestacaoTexto,
      alimentadorSubTexto,
      osTabletTexto,
      itensMO,
      consumo: (consumo || []).map((item) => ({ ...item })),
      sucata: (sucata || []).map((item) => ({ ...item })),
      medicaoValorUpsLM: valorUpsLM,
      medicaoValorUpsLV: valorUpsLV,
      medicaoForaHC: foraHorario,
      medicaoItensSnapshot: medicaoItensSnapshotLocal,
      medicaoTab: pdfModalidade,
      currentUserNameSnapshot: currentUserName,
      numeroSigod,
      numeroSs,
      equipeInfo: {
        codigoSelecionado: equipeSelecionadaCodigo,
        linhaSelecionada: equipeSelecionadaLinha,
        encarregadoSelecionado: equipeSelecionadaEncarregado,
      },
      detalhesEquipes: {
        encarregadoLinhaLM,
        encarregadoLinhaLV,
        encarregadoPrincipal,
        principalLinhaInferida,
      },
    };
  };

  const calcularResumoMaoDeObra = (contexto: OrcamentoPdfContext): MaoDeObraResumo => {
    const itensOrigem = contexto.itensMO || [];
    const valorReferencia = contexto.medicaoTab === "LM" ? contexto.medicaoValorUpsLM : contexto.medicaoValorUpsLV;
    const itensCalculados = itensOrigem.map((item, idx) => {
      const upsQtd = Number(
        item.valorUps ?? item.ups ?? valorReferencia ?? 0
      );
      const quantidade = Number(item.quantidade) || 0;
      const subtotalFromItem =
        Number(item.subtotal ?? item.total ?? item.valor_total ?? 0) || 0;
      const subtotal =
        subtotalFromItem > 0
          ? subtotalFromItem
          : quantidade * upsQtd * (valorReferencia || 0);
      return {
        index: idx + 1,
        codigo: item.codigo,
        descricao: item.descricao,
        unidade: item.unidade || "UN",
        operacao: item.operacao || "-",
        upsQtd,
        quantidade,
        subtotal,
      };
    });
    const totalBase = itensCalculados.reduce((acc, row) => acc + row.subtotal, 0);
    const totalComAdicional = aplicarPercentualFinal(totalBase, contexto.medicaoForaHC);
    const acrescimoValor = totalComAdicional - totalBase;
    const acrescimoInfo = contexto.medicaoForaHC
      ? {
          codigo: "26376",
          descricao: "SERV. EMERG. FORA DO HORáRIO COMERCIAL – ADICIONAL 30%",
        }
      : {
          codigo: "92525",
          descricao: "SERV. EMERG. HORáRIO COMERCIAL – ADICIONAL 12%",
        };

    return { itensCalculados, totalBase, totalComAdicional, acrescimoValor, acrescimoInfo };
  };

  const registrarPdfGerado = (modalidade: "LM" | "LV") => {
    setPdfGeradoPorModalidade((prev) => ({ ...prev, [modalidade]: true }));
    setUltimoPdfGeradoEm(new Date().toISOString());
  };

  const gerarOrcamento = async () => {
    if (!selectedItem) {
      alert("Nenhum acionamento selecionado");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado");
      return;
    }

    const pdfModalidade: "LM" | "LV" = medicaoTab === "LM" ? "LM" : "LV";
    if (!equipeValidaParaLinha(pdfModalidade)) {
      alert(`Selecione uma equipe de ${pdfModalidade === "LM" ? "Linha Morta" : "Linha Viva"} vílida antes de gerar o PDF.`);
      return;
    }

    alert("Iniciando geração de PDF...");

    try {
      const contexto = await prepararOrcamentoContext(idAcionamento, pdfModalidade);
      if (!contexto) return;
      const resumoMO = calcularResumoMaoDeObra(contexto);

      const doc = new jsPDF("landscape");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const palette =
        pdfModalidade === "LV"
          ? {
              main: [16, 95, 64] as [number, number, number],
              header: [224, 244, 235] as [number, number, number],
              alt: [237, 249, 243] as [number, number, number],
            }
          : {
              main: [51, 102, 153] as [number, number, number],
              header: [230, 240, 250] as [number, number, number],
              alt: [245, 250, 255] as [number, number, number],
            };
      const mainColor = palette.main;
      const headerBg = palette.header;
      const altRowBg = palette.alt;
      
      // ==================== CABEÇALHO COM LOGO ====================
      // Fundo azul cabeçalho
      doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.rect(0, 0, pageWidth, 30, "F");
      // Logo centralizada e maior
      try {
        const logoImg = await loadImageElement(logoEngeletrica);
        const logoWidth = 38;
        const logoHeight = 16;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoImg, "PNG", logoX, 5, logoWidth, logoHeight);
      } catch (err) {
        console.warn("Logo não pôde ser carregada", err);
      }
      const headerBase = contexto.headerBase;
      const detalhesAcionamento = contexto.detalhesAcionamento;
      const dadosExec = contexto.dadosExec;
      const selectedSnapshot = contexto.selectedItemSnapshot;
      const medicaoTabAtual = contexto.medicaoTab;
      const modalidadeLabel =
        contexto.pdfModalidade === "LM"
          ? "Linha Morta"
          : contexto.pdfModalidade === "LV"
          ? "Linha Viva"
          : contexto.pdfModalidade;
      const reportTitle = `Fechamento de OS - ${modalidadeLabel}`;

      // Título centralizado abaixo da logo
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(reportTitle, pageWidth / 2, 28, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Modalidade: ${modalidadeLabel}`, pageWidth / 2, 33, { align: "center" });
      let yPos = 34;

      // ==================== CABEÇALHO OPERACIONAL ====================
      doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.rect(0, yPos, pageWidth, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("CABEÇALHO OPERACIONAL", 10, yPos + 4);
      yPos += 8;

      const dataExecucaoTexto = contexto.dataExecucaoTexto;
      const codigoAcionamento = contexto.codigoAcionamento;
      const numeroIntervencaoTexto = contexto.numeroIntervencaoTexto;
      const equipeTexto = contexto.equipeTexto;
      const encarregadoTexto = contexto.encarregadoTexto;
      const tecnicoTexto = contexto.tecnicoTexto;
      const enderecoTexto = contexto.enderecoTexto;
      const alimentadorSubTexto = contexto.alimentadorSubTexto;
      const osTabletTexto = contexto.osTabletTexto;

      const headerMarginX = 10;
      const headerWidth = pageWidth - headerMarginX * 2;
      const headerColWidth = headerWidth / 3;
      const row4FirstWidth = headerWidth * 0.65;
      const row4SecondWidth = headerWidth - row4FirstWidth;

      const drawHeaderField = (
        baseY: number,
        label: string,
        value: string | undefined,
        x: number,
        width: number,
        highlight = false
      ) => {
        const rawValue = typeof value === "string" ? value : value != null ? String(value) : "";
        const displayValue = rawValue.trim().length > 0 ? rawValue.trim() : "--";
        const valueFontSize = highlight ? 11 : 8;
        doc.setFont("helvetica", highlight ? "bold" : "normal");
        doc.setFontSize(valueFontSize);
        const lines = doc.splitTextToSize(displayValue, width - 4);
        const blockHeight = Math.max(12, 7 + lines.length * 4);
        doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
        doc.setDrawColor(mainColor[0], mainColor[1], mainColor[2]);
        doc.setLineWidth(0.1);
        doc.rect(x, baseY, width, blockHeight, "FD");
        doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(label.toUpperCase(), x + 2, baseY + 3.5);
        doc.setTextColor(0);
        doc.setFont("helvetica", highlight ? "bold" : "normal");
        doc.setFontSize(valueFontSize);
        let lineY = baseY + 7;
        lines.forEach((line) => {
          doc.text(line, x + 2, lineY);
          lineY += 4;
        });
        return blockHeight;
      };

      const drawInfoRow = (
        fields: { label: string; value: string; highlight?: boolean }[],
        widths: number[]
      ) => {
        const rowStartY = yPos;
        let cursorX = headerMarginX;
        let rowHeight = 0;
        fields.forEach((field, idx) => {
          const height = drawHeaderField(
            rowStartY,
            field.label,
            field.value,
            cursorX,
            widths[idx],
            field.highlight
          );
          rowHeight = Math.max(rowHeight, height);
          cursorX += widths[idx];
        });
        yPos += rowHeight + 3;
      };

      drawInfoRow(
        [
          { label: "Data da execução", value: dataExecucaoTexto },
          { label: "Cód. acionamento", value: codigoAcionamento, highlight: true },
          { label: "Nº intervenção (SIGOD/SS)", value: numeroIntervencaoTexto },
        ],
        [headerColWidth, headerColWidth, headerColWidth]
      );

      drawInfoRow(
        [
          { label: "Equipe", value: equipeTexto },
          { label: "Encarregado", value: encarregadoTexto },
          { label: "Técnico", value: tecnicoTexto },
        ],
        [headerColWidth, headerColWidth, headerColWidth]
      );

      drawInfoRow(
        [{ label: "Endereço", value: enderecoTexto }],
        [headerWidth]
      );

      drawInfoRow(
        [
          { label: "Alimentador / Subestação", value: alimentadorSubTexto },
          { label: "OS tablet", value: osTabletTexto },
        ],
        [row4FirstWidth, row4SecondWidth]
      );

      yPos += 2;
      
      const execColWidth = (pageWidth - 30) / 3;
      let rowBg = true;

      // ==================== INFORMAÇÕES DE EXECUÇÃO ====================
      if (dadosExec) {
        doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
        doc.rect(0, yPos, pageWidth, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("INFORMAÇÕES DE EXECUÇÃO", 10, yPos + 4);
        yPos += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(0);
        rowBg = true;
        
        // Linha 1
        if (rowBg) {
          doc.setFillColor(altRowBg[0], altRowBg[1], altRowBg[2]);
          doc.rect(0, yPos, pageWidth, 5, "F");
        }
        doc.text(`Saída: ${dadosExec?.saida_base ? new Date(dadosExec.saida_base).toLocaleTimeString() : "N/A"}`, 10, yPos + 3.5, { maxWidth: execColWidth - 5 });
        doc.text(`Retorno: ${dadosExec?.retorno_base ? new Date(dadosExec.retorno_base).toLocaleTimeString() : "N/A"}`, 10 + execColWidth, yPos + 3.5, { maxWidth: execColWidth - 5 });
        doc.text(`Alimentador: ${dadosExec?.alimentador || "N/A"}`, 10 + 2 * execColWidth, yPos + 3.5, { maxWidth: execColWidth - 5 });
        yPos += 5;
        
        // Linha 2
        rowBg = !rowBg;
        if (rowBg) {
          doc.setFillColor(altRowBg[0], altRowBg[1], altRowBg[2]);
          doc.rect(0, yPos, pageWidth, 5, "F");
        }
        doc.text(`KM Inicial: ${dadosExec?.km_inicial || "N/A"}`, 10, yPos + 3.5, { maxWidth: execColWidth - 5 });
        doc.text(`KM Final: ${dadosExec?.km_final || "N/A"}`, 10 + execColWidth, yPos + 3.5, { maxWidth: execColWidth - 5 });
        doc.text(`Subestação: ${dadosExec?.subestacao || "N/A"}`, 10 + 2 * execColWidth, yPos + 3.5, { maxWidth: execColWidth - 5 });
        yPos += 5;
        
        yPos += 2;
      }
      
      // ==================== MÃO DE OBRA ====================
      doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.rect(0, yPos, pageWidth, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`MÃO DE OBRA - ${medicaoTabAtual}`, 10, yPos + 4);
      yPos += 6;

      const itensMOCalculados = resumoMO.itensCalculados;
      const totalBaseMO = resumoMO.totalBase;
      const totalMO = resumoMO.totalComAdicional;

      if (itensMOCalculados.length > 0) {
        const bodyMO = itensMOCalculados.map((item) => [
          item.index,
          item.codigo,
          item.descricao,
          item.operacao,
          item.unidade,
          `${item.upsQtd.toFixed(2)}`,
          `${item.quantidade.toFixed(2)}`,
          `${item.subtotal.toFixed(2)}`,
        ]);

        if (totalBaseMO > 0.005) {
          bodyMO.push([
            "",
            "",
            "TOTAL MÃO DE OBRA (SEM ADICIONAL)",
            "-",
            "",
            "",
            "",
            `${totalBaseMO.toFixed(2)}`,
          ]);
        }

        if (resumoMO.acrescimoValor > 0.005) {
          bodyMO.push([
            "",
            resumoMO.acrescimoInfo.codigo,
            resumoMO.acrescimoInfo.descricao,
            "-",
            "UN",
            "1.00",
            `${resumoMO.acrescimoValor.toFixed(2)}`,
            `${resumoMO.acrescimoValor.toFixed(2)}`,
          ]);
        }
        
        autoTable(doc, {
          startY: yPos,
          head: [["ITEM", "CÓD", "DESCRIÇÃO", "OPERAÇÃO", "Un", "VALOR UPS", "QTD", "TOTAL R$"]],
          body: bodyMO,
          styles: { 
            fontSize: 7, 
            cellPadding: 2,
            lineColor: [200, 200, 200],
            lineWidth: 0.3
          },
          headStyles: { 
            fillColor: mainColor, 
            textColor: 255, 
            fontStyle: "bold",
            halign: "center"
          },
          alternateRowStyles: {
            fillColor: altRowBg
          },
          columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 18, halign: "center" },
            2: { cellWidth: 120, halign: "left" },
            3: { cellWidth: 24, halign: "center" },
            4: { cellWidth: 16, halign: "center" },
            5: { cellWidth: 22, halign: "right" },
            6: { cellWidth: 16, halign: "center" },
            7: { cellWidth: 28, halign: "right" }
          },
          theme: "grid",
          margin: { left: 5, right: 5 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 3;
      }

      // Total MO com destaque
      const totalBoxWidth = 110;
      const totalBoxHeight = 10;
      doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.rect(pageWidth - totalBoxWidth - 10, yPos, totalBoxWidth, totalBoxHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`TOTAL MO: R$ ${totalMO.toFixed(2)}`, pageWidth - 15, yPos + totalBoxHeight - 3, { align: "right" });
      yPos += totalBoxHeight + 4;

      // ==================== MATERIAL APLICADO ====================
      if (contexto.consumo.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage("landscape");
          yPos = 10;
        }
        
        doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
        doc.rect(0, yPos, pageWidth, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("MATERIAL APLICADO", 10, yPos + 5);
        yPos += 7;

        const bodyConsumo = contexto.consumo.map((c, idx) => [
          idx + 1,
          c.codigo_material,
          c.descricao_item || "",
          c.unidade_medida || "",
          Number(c.quantidade || 1).toFixed(2)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["ITEM", "CÓD", "DESCRIÇÃO", "UNIDADE", "QUANTIDADE"]],
          body: bodyConsumo,
          styles: { 
            fontSize: 7, 
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.3
          },
          headStyles: { 
            fillColor: mainColor, 
            textColor: 255, 
            fontStyle: "bold",
            halign: "center"
          },
          alternateRowStyles: {
            fillColor: altRowBg
          },
          columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 25, halign: "center" },
            2: { cellWidth: 180, halign: "left" },
            3: { cellWidth: 25, halign: "center" },
            4: { cellWidth: 25, halign: "center" }
          },
          theme: "grid"
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
      }

      // ==================== MATERIAL RETIRADO ====================
      if (contexto.sucata.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage("landscape");
          yPos = 10;
        }
        
        doc.setFillColor(mainColor[0], mainColor[1], mainColor[2]);
        doc.rect(0, yPos, pageWidth, 7, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text("MATERIAL RETIRADO / SUCATA", 10, yPos + 5);
        yPos += 7;

        const bodySucata = contexto.sucata.map((s, idx) => [
          idx + 1,
          s.codigo_material,
          s.descricao_item || "",
          s.unidade_medida || "",
          s.classificacao || "",
          Number(s.quantidade).toFixed(2)
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["ITEM", "CÓD", "DESCRIÇÃO", "UNIDADE", "CLASSIFICAÇÃO", "QUANTIDADE"]],
          body: bodySucata,
          styles: { 
            fontSize: 7, 
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.3
          },
          headStyles: { 
            fillColor: mainColor, 
            textColor: 255, 
            fontStyle: "bold",
            halign: "center"
          },
          alternateRowStyles: {
            fillColor: altRowBg
          },
          columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 20, halign: "center" },
            2: { cellWidth: 140, halign: "left" },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 35, halign: "center" },
            5: { cellWidth: 25, halign: "center" }
          },
          theme: "grid"
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
      }

      // ==================== ASSINATURAS ====================
      yPos = pageHeight - 45;
      const assinaturaColWidth = (pageWidth - 30) / 3;
      
      doc.setDrawColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.setLineWidth(0.5);
      
      doc.line(10, yPos + 15, 10 + assinaturaColWidth - 5, yPos + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.text("LÍDER DE EQUIPE", 10 + assinaturaColWidth / 2 - 5, yPos + 20, { align: "center" });
      
      doc.line(10 + assinaturaColWidth + 5, yPos + 15, 10 + 2 * assinaturaColWidth, yPos + 15);
      doc.text("FISCAL", 10 + 1.5 * assinaturaColWidth + 5, yPos + 20, { align: "center" });
      
      doc.line(10 + 2 * assinaturaColWidth + 10, yPos + 15, 10 + 3 * assinaturaColWidth + 5, yPos + 15);
      doc.text("CLIENTE / RESPONSÁVEL", 10 + 2.5 * assinaturaColWidth + 10, yPos + 20, { align: "center" });

      // ==================== RODAPÉ ====================
      doc.setFontSize(6);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      const rodape = `Orçamento gerado em ${new Date().toLocaleString("pt-BR")} | Sistema de Gestão de Obras`;
      doc.text(rodape, pageWidth / 2, pageHeight - 3, { align: "center" });

      console.log("­ƒÆ¥ Salvando PDF...");
      const nomeArquivo = `Orcamento_${selectedSnapshot.codigo_acionamento || "acionamento"}_${medicaoTabAtual}_${new Date().getTime()}.pdf`;
      
      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      alert(" PDF gerado com sucesso! Verifique Downloads");
      console.log(" PDF SALVO!");
      setMaterialInfo(" PDF gerado com sucesso!");
      registrarPdfGerado(pdfModalidade);
    } catch (error: any) {
      alert(`ERRO: ${error?.message}`);
      console.error("ERRO:", error);
      setMaterialInfo(`Erro: ${error?.message}`);
    }
  };

  const exportarOrcamentoExcel = async (
    forcedModalidade?: "LM" | "LV",
    ignoreEquipeValidation?: boolean
  ) => {
    if (!selectedItem) {
      alert("Nenhum acionamento selecionado");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado");
      return;
    }

    const pdfModalidade: "LM" | "LV" =
      forcedModalidade ?? (medicaoTab === "LM" ? "LM" : "LV");
    if (!ignoreEquipeValidation && !equipeValidaParaLinha(pdfModalidade)) {
      alert(`Selecione uma equipe de ${pdfModalidade === "LM" ? "Linha Morta" : "Linha Viva"} válida antes de gerar o Excel.`);
      return;
    }

    setMaterialError(null);
    setMaterialInfo(null);

    try {
      const contexto = await prepararOrcamentoContext(idAcionamento, pdfModalidade, selectedItem);
      if (!contexto) return;

      const resumoMO = calcularResumoMaoDeObra(contexto);

      const captureHiddenSheetSnapshot = (worksheet: any) => {
        const cells: Array<{
          row: number;
          col: number;
          value?: unknown;
          formula?: string;
          result?: unknown;
          numFmt?: string;
        }> = [];
        for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
          const row = worksheet.getRow(rowIndex);
          row.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
            const cellValue = cell.value;
            const isFormula =
              cellValue &&
              typeof cellValue === "object" &&
              "formula" in cellValue &&
              typeof (cellValue as any).formula === "string";
            if (!isFormula && (cellValue === null || cellValue === undefined)) {
              return;
            }
            const formula = isFormula ? (cellValue as any).formula : undefined;
            const result = isFormula ? (cellValue as any).result : undefined;
            cells.push({
              row: rowIndex,
              col,
              value: isFormula ? undefined : cellValue,
              formula,
              result,
              numFmt: cell.numFmt,
            });
          });
        }
        return cells;
      };

      const restoreHiddenSheetSnapshot = (worksheet: any, snapshot: ReturnType<typeof captureHiddenSheetSnapshot>) => {
        snapshot.forEach((cellSnapshot) => {
          const row = worksheet.getRow(cellSnapshot.row);
          const cell = row.getCell(cellSnapshot.col);
          if (cellSnapshot.formula) {
            cell.value = {
              formula: cellSnapshot.formula,
              result: cellSnapshot.result,
            };
          } else {
            cell.value = cellSnapshot.value ?? null;
          }
          if (cellSnapshot.numFmt) {
            cell.numFmt = cellSnapshot.numFmt;
          }
        });
      };

      const ExcelJS = (await import("exceljs")).default;
      const templateUrl = contexto.pdfModalidade === "LM" ? lmMedicaoTemplateUrl : lvMedicaoTemplateUrl;
      const response = await fetch(templateUrl);
      if (!response.ok) {
        throw new Error(`Não foi possível carregar o modelo de Excel (${response.status})`);
      }
      const templateBuffer = await response.arrayBuffer();
      const templateData =
        templateBuffer instanceof ArrayBuffer ? new Uint8Array(templateBuffer) : templateBuffer;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(templateData);
      const sheet = workbook.getWorksheet("PADRAO") || workbook.worksheets[0];
      if (!sheet) {
        throw new Error("Planilha de modelo inválida.");
      }
      const hiddenSheetSnapshots = new Map<string, ReturnType<typeof captureHiddenSheetSnapshot>>();
      workbook.worksheets.forEach((worksheet) => {
        if ((worksheet.state && worksheet.state !== "visible") || worksheet.state === "hidden") {
          hiddenSheetSnapshots.set(worksheet.name, captureHiddenSheetSnapshot(worksheet));
        }
      });

      const extractCellText = (value: unknown) => {
        if (typeof value === "string") return value;
        if (value && typeof value === "object") {
          if ("richText" in value) {
            return (value as any).richText.map((segment: any) => segment.text).join("");
          }
          if ("text" in value) {
            return (value as any).text;
          }
        }
        return "";
      };

      const normalizeLabel = (value?: string) =>
        value ? value.replace(/[=>:]/g, "").trim().toUpperCase() : "";

      const findCellByLabel = (label: string) => {
        for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
          const row = sheet.getRow(rowNumber);
          for (let column = 1; column <= sheet.columnCount; column++) {
            const cell = row.getCell(column);
            const cellValue = extractCellText(cell.value);
            const text = normalizeLabel(cellValue);
            if (text === normalizeLabel(label)) {
              return { row: rowNumber, col: column };
            }
          }
        }
        return null;
      };

      const findRowNumberByLabel = (label: string) => {
        const found = findCellByLabel(label);
        return found ? found.row : null;
      };

      const fillHeaderCell = (label: string, value?: string | number) => {
        const match = findCellByLabel(label);
        if (!match) return;
        const targetRow = sheet.getRow(match.row + 1);
        targetRow.getCell(match.col).value = value ?? "";
      };

      const getFormulaText = (cell: any) => {
        if (!cell) return null;
        if (typeof cell.value === "string" && cell.value.startsWith("=")) return cell.value;
        if (cell.formula) return `=${cell.formula}`;
        return null;
      };

      const copyRowStyle = (sourceRow: any, targetRow: any) => {
        targetRow.height = sourceRow.height;
        sourceRow.eachCell({ includeEmpty: true }, (sourceCell: any, col: number) => {
          const targetCell = targetRow.getCell(col);
          targetCell.font = sourceCell.font;
          targetCell.fill = sourceCell.fill;
          targetCell.border = sourceCell.border;
          targetCell.alignment = sourceCell.alignment;
          targetCell.numFmt = sourceCell.numFmt;
        });
      };

      const parseNumeroCodigo = (value: unknown) => {
        if (value === null || value === undefined) return null;
        const stringValue = String(value).trim();
        if (stringValue.length === 0) return null;
        const numeric = Number(stringValue.replace(/[^0-9]/g, ""));
        return Number.isFinite(numeric) ? numeric : null;
      };


      const fillLinhaVivaMoRows = (items: any[], valorUpsReferencia: number) => {
        const moStartRow = 21;
        const moFooterRowStart = 37;
        const baseRow = sheet.getRow(moStartRow);
        const baseFormula = getFormulaText(baseRow.getCell("C"));
        const baseCapacity = moFooterRowStart - moStartRow;
        const extraRows = Math.max(0, items.length - baseCapacity);
        let footerRow = moFooterRowStart;
        for (let i = 0; i < extraRows; i += 1) {
          sheet.spliceRows(footerRow, 0, []);
          const newRow = sheet.getRow(footerRow);
          copyRowStyle(baseRow, newRow);
          if (baseFormula) {
            newRow.getCell("C").value = baseFormula.replace(/B\d+/g, `B${footerRow}`);
          }
          footerRow += 1;
        }
        const totalRows = footerRow - moStartRow;
        const formulaForRow = (rowNumber: number) =>
          baseFormula ? baseFormula.replace(/B\d+/g, `B${rowNumber}`) : null;
        for (let idx = 0; idx < totalRows; idx += 1) {
          const rowNumber = moStartRow + idx;
          const row = sheet.getRow(rowNumber);
          copyRowStyle(baseRow, row);
          const formula = formulaForRow(rowNumber);
          const formulaCell = row.getCell("C");
          const existingFormula = getFormulaText(formulaCell);
          if (!existingFormula && formula) {
            formulaCell.value = formula;
          }
          if (idx < items.length) {
            const codigoValue = parseNumeroCodigo(items[idx].codigo);
            const targetCell = row.getCell("B");
            if (codigoValue === null) {
              targetCell.value = items[idx].codigo || "";
              targetCell.numFmt = "@";
            } else {
              targetCell.value = codigoValue;
              targetCell.numFmt = "0";
            }
            const descriptionValue =
              items[idx].descricao ||
              items[idx].descricao_item ||
              items[idx].descricao_tipo ||
              "";
            const descCell = row.getCell("C");
            descCell.value = descriptionValue;
            const upsQtd = Number(items[idx].upsQtd ?? 0);
            const valorUnitarioValue = upsQtd * valorUpsReferencia;
            const unidadeValue =
              items[idx].unidade ||
              items[idx].unidade_medida ||
              items[idx].unidade_medida_cons ||
              "";
            const unidadeCell = row.getCell("S");
            const unidadeAlreadyFormula = getFormulaText(unidadeCell);
            if (!unidadeAlreadyFormula) {
              unidadeCell.value = unidadeValue;
            }
            const valorUnitarioCell = row.getCell("T");
            const valorUnitarioFormula = getFormulaText(valorUnitarioCell);
            if (!valorUnitarioFormula) {
              valorUnitarioCell.value = Number.isFinite(valorUnitarioValue) ? valorUnitarioValue : null;
              valorUnitarioCell.numFmt = "#,##0.00";
            }
            const quantidadeValue =
              Number(items[idx].quantidade ?? items[idx].qtde ?? items[idx].qtd ?? 0) ||
              Number(items[idx].quantidade_prevista ?? 0);
            const quantidadeCell = row.getCell("AJ");
            const quantidadeFormula = getFormulaText(quantidadeCell);
            if (!quantidadeFormula) {
              quantidadeCell.value = Number.isFinite(quantidadeValue) ? quantidadeValue : null;
              quantidadeCell.numFmt = "#,##0.00";
            }
            const valorItemCell = row.getCell("AK");
            const valorItemFormula = getFormulaText(valorItemCell);
            if (!valorItemFormula) {
              const totalValue = quantidadeValue * valorUnitarioValue;
              valorItemCell.value = Number.isFinite(totalValue) ? totalValue : null;
              valorItemCell.numFmt = "#,##0.00";
            }
          } else {
            row.getCell("B").value = null;
            row.getCell("C").value = null;
          }
        }
      };

      const isLinhaVivaExport = contexto.pdfModalidade === "LV";
      const isForaHC = contexto.medicaoForaHC;

      if (!isLinhaVivaExport) {
        const descriptionColumns = [
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
          "Q",
          "R",
          "S",
          "T",
          "U",
        ];

        const fillDescriptionCells = (row: any, text: string) => {
          descriptionColumns.forEach((column) => {
            row.getCell(column).value = text || "";
          });
        };

        const captureRowStyles = (row: any) => {
          const styles: Record<number, any> = {};
          row.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
            styles[col] = {
              font: cell.font,
              fill: cell.fill,
              border: cell.border,
              alignment: cell.alignment,
              numFmt: cell.numFmt,
            };
          });
          return styles;
        };

        const applyRowStyles = (row: any, styles: Record<number, any>) => {
          row.eachCell({ includeEmpty: true }, (cell: any, col: number) => {
            const style = styles[col];
            if (!style) return;
            cell.font = style.font;
            cell.fill = style.fill;
            cell.border = style.border;
            cell.alignment = style.alignment;
            cell.numFmt = style.numFmt;
          });
        };

        const tableStartRow = 28;
        const baseTableCapacity = 14;
        let tableCapacity = baseTableCapacity;
        const tableSampleStyles = captureRowStyles(sheet.getRow(tableStartRow));

        const itensMO = resumoMO.itensCalculados;
        const rowsNeeded = Math.max(itensMO.length, 1);
        for (let index = 0; index < tableCapacity; index++) {
          const row = sheet.getRow(tableStartRow + index);
          applyRowStyles(row, tableSampleStyles);
          if (index >= rowsNeeded) {
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.value = null;
            });
            continue;
          }
          const item = itensMO[index];
          const upsValue = Number(item?.upsQtd ?? 0);
          const quantity = Number(item?.quantidade ?? 0);
          const subtotal = Number(item?.subtotal ?? 0);
          row.getCell("B").value = index + 1;
          row.getCell("C").value = item?.codigo || "";
          fillDescriptionCells(row, item?.descricao || "");
          row.getCell("V").value = item?.unidade || "UN";
          row.getCell("W").value = upsValue;
          row.getCell("X").value = quantity;
          row.getCell("Y").value = quantity > 0 ? quantity : null;
          row.getCell("Z").value = quantity > 0 ? quantity : null;
          row.getCell("AA").value = quantity;
          row.getCell("AB").value = subtotal;
          row.getCell("AC").value = subtotal;
          ["W", "X", "Y", "Z", "AA", "AB", "AC"].forEach((column) => {
            row.getCell(column).numFmt = "#,##0.00";
          });
        }

        const findRowByFormula = (column: string, fragment: string) => {
          for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
            const cellValue = sheet.getRow(rowNumber).getCell(column)?.value;
            if (cellValue && typeof cellValue === "object" && "formula" in cellValue) {
              if ((cellValue as any).formula?.includes(fragment)) {
                return sheet.getRow(rowNumber);
              }
            }
          }
          return null;
        };

        const totalRow = findRowByFormula("AB", "SUM(AB");
        if (totalRow) {
          totalRow.getCell("AB").value = resumoMO.totalBase;
          totalRow.getCell("AC").value = resumoMO.totalBase;
          ["AB", "AC"].forEach((column) => {
            totalRow.getCell(column).numFmt = "#,##0.00";
          });
        }

        const additionRow30 = findCellByLabel("SERV. EMERG. FORA DO HORARIO COMERCIAL-ADICIONAL 30%");
        const additionRow12 = findCellByLabel("SERV. EMERG. HORARIO COMERCIAL - ADICIONAL 12%");
        const fillAdicionalRow = (rowNumber: number | null, isActive: boolean) => {
          if (!rowNumber) return;
          const row = sheet.getRow(rowNumber);
          if (!isActive) {
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.value = null;
            });
            return;
          }
          const amount = Math.max(resumoMO.acrescimoValor, 0);
          const codigo = resumoMO.acrescimoInfo.codigo || "";
          const descricao = resumoMO.acrescimoInfo.descricao || "";
          row.getCell("B").value = codigo;
          row.getCell("C").value = codigo;
          fillDescriptionCells(row, descricao);
          row.getCell("V").value = "ADIC";
          row.getCell("W").value = amount;
          const flag = amount > 0 ? 1 : 0;
          row.getCell("X").value = flag;
          row.getCell("Y").value = flag;
          row.getCell("Z").value = flag;
          row.getCell("AA").value = flag;
          row.getCell("AB").value = amount;
          row.getCell("AC").value = amount;
          ["W", "X", "Y", "Z", "AA", "AB", "AC"].forEach((column) => {
            row.getCell(column).numFmt = "#,##0.00";
          });
        };
        fillAdicionalRow(additionRow30?.row ?? null, isForaHC);
        fillAdicionalRow(additionRow12?.row ?? null, !isForaHC);

        const fillMaterialSection = (label: string, items: any[]) => {
          const labelCell = findCellByLabel(label);
          if (!labelCell) return;
          const dataStart = labelCell.row + 2;
          const capacity = Math.min(12, sheet.rowCount - dataStart + 1);
          if (capacity <= 0) return;
          const sampleStyles = captureRowStyles(sheet.getRow(dataStart));
          for (let index = 0; index < capacity; index++) {
            const row = sheet.getRow(dataStart + index);
            applyRowStyles(row, sampleStyles);
            if (index >= items.length) {
              row.eachCell({ includeEmpty: true }, (cell) => {
                cell.value = null;
              });
              continue;
            }
            const material = items[index];
            const quantity = Number(material.quantidade || 0);
            row.getCell("B").value = index + 1;
            row.getCell("C").value = material.codigo_material || material.codigo || "";
            fillDescriptionCells(row, material.descricao_item || material.descricao || "");
            row.getCell("V").value = material.unidade_medida || material.unidade || "";
            row.getCell("W").value = Number(material.valor || material.valor_unitario || 0);
            row.getCell("X").value = quantity;
            row.getCell("AA").value = quantity;
            row.getCell("AB").value = quantity;
            row.getCell("AC").value = quantity;
            ["W", "X", "AA", "AB", "AC"].forEach((column) => {
              row.getCell(column).numFmt = "#,##0.00";
            });
          }
        };

        fillHeaderCell("EQUIPE=>", contexto.equipeTexto);
        fillHeaderCell("ENCARREGADO:", contexto.encarregadoTexto);
        fillHeaderCell("TÉCNICO ENG:", contexto.tecnicoTexto);
        fillHeaderCell("DATA SAÍDA =>", formatDateTimeBr(contexto.dadosExec?.saida_base));
        fillHeaderCell("RETORNO BASE =>", formatDateTimeBr(contexto.dadosExec?.retorno_base));
        fillHeaderCell("INICIO SERVIÇO =>", formatDateTimeBr(contexto.dadosExec?.inicio_servico));
        fillHeaderCell("RETORNO SERVIÇO =>", formatDateTimeBr(contexto.dadosExec?.retorno_servico));
        fillHeaderCell("KM INICIAL=>", contexto.dadosExec?.km_inicial || "");
        fillHeaderCell("KM FINAL=>", contexto.dadosExec?.km_final || "");
        fillHeaderCell("CÓD. ACIONAMENTO=>", contexto.codigoAcionamento);
        fillHeaderCell("Nº INTERVENÇÃO=>", contexto.numeroIntervencaoTexto);
        fillHeaderCell("NOTA (SS)=>", contexto.numeroSs || "");
        fillHeaderCell("OS TABLET =>", contexto.osTabletTexto);
        fillHeaderCell("ENDEREÇO=>", contexto.enderecoTexto);
        fillHeaderCell("ALIMENTADOR =>", contexto.alimentadorTexto);
        fillHeaderCell("SUBESTAÇÃO =>", contexto.subestacaoTexto);
        fillHeaderCell("OBSERVAÇÃO =>", contexto.headerBase?.observacao || "");

        fillMaterialSection("MATERIAL APLICADO", contexto.consumo || []);
        fillMaterialSection("MATERIAL RETIRADO", contexto.sucata || []);
      }

      const markAdicionalCells = () => {
        const cell30 = sheet.getCell("AG39");
        const cell12 = sheet.getCell("AG40");
        if (!getFormulaText(cell30)) {
          cell30.value = isForaHC ? 1 : null;
        }
        if (!getFormulaText(cell12)) {
          cell12.value = isForaHC ? null : 1;
        }
      };

      markAdicionalCells();

      if (isLinhaVivaExport) {
        const executionDate = parseDateForExcel(contexto.dataExecucaoTexto);
        const dateCell = sheet.getCell("U5");
        if (executionDate) {
          dateCell.value = executionDate;
          dateCell.numFmt = "dd/mm/yyyy";
        } else {
          dateCell.value = contexto.dataExecucaoTexto || "";
        }
        sheet.getCell("AH5").value = contexto.codigoAcionamento || "";
        sheet.getCell("AH12").value = contexto.numeroIntervencaoTexto || "";
        sheet.getCell("C5").value = contexto.equipeTexto || "";
        sheet.getCell("E11").value = contexto.encarregadoTexto || "";
        sheet.getCell("C8").value = contexto.enderecoTexto || "";
        sheet.getCell("C13").value = contexto.alimentadorSubTexto || "";
        sheet.getCell("J13").value = contexto.dadosExec?.subestacao || "";
        sheet.getCell("Q13").value = contexto.dadosExec?.numero_transformador || "";
        sheet.getCell("Y11").value = contexto.dadosExec?.id_poste || "";
        sheet.getCell("AH2").value = contexto.numeroSs || "";
        sheet.getCell("AB8").value = contexto.osTabletTexto || "";
        sheet.getCell("K5").value = contexto.dadosExec?.km_inicial || "";
        sheet.getCell("N5").value = contexto.dadosExec?.km_final || "";
        const valorUpsReferencia = contexto.medicaoTab === "LV" ? contexto.medicaoValorUpsLV : contexto.medicaoValorUpsLM;
        fillLinhaVivaMoRows(resumoMO.itensCalculados, valorUpsReferencia);
        const fillLinhaVivaMaterialRows = (
          items: any[],
          startRow: number,
          quantityColumn: string = "AK",
          unitColumn: string = "T",
          baseCapacity = 15,
          classificationMap: Record<string, string> = {}
        ) => {
          const baseRow = sheet.getRow(startRow);
          const unitFormula = getFormulaText(baseRow.getCell(unitColumn));
          for (let idx = 0; idx < baseCapacity; idx += 1) {
            const rowNumber = startRow + idx;
            const row = sheet.getRow(rowNumber);
            const codeCell = row.getCell("B");
            const descriptionCell = row.getCell("C");
            const unitCell = row.getCell(unitColumn);
            const quantityCell = row.getCell(quantityColumn);
            const hasItem = idx < items.length;
            if (hasItem) {
              const material = items[idx];
              const codigoValue = parseNumeroCodigo(material.codigo_material || material.codigo);
              if (codigoValue === null) {
                codeCell.value = material.codigo_material || material.codigo || "";
                codeCell.numFmt = "@";
              } else {
                codeCell.value = codigoValue;
                codeCell.numFmt = "0";
              }
              const descriptionValue =
                material.descricao_item ||
                material.descricao ||
                material.nome ||
                "";
              descriptionCell.value = descriptionValue;
              const unidadeValue =
                material.unidade_medida ||
                material.unidade ||
                material.unidade_medida_cons ||
                "";
              if (!unitFormula) {
                unitCell.value = unidadeValue || null;
              }
              const quantidadeValue = Number(
                material.quantidade ?? material.quantidade_aplicada ?? material.quantidade_retirada ?? 0
              );
              quantityCell.value = Number.isFinite(quantidadeValue) ? quantidadeValue : null;
              quantityCell.numFmt = "#,##0.00";
              const classification = (material.classificacao || "").toString().trim().toUpperCase();
              Object.entries(classificationMap).forEach(([key, column]) => {
                const cell = row.getCell(column);
                cell.value = classification === key.toUpperCase() ? "X" : null;
              });
            } else {
              codeCell.value = null;
              descriptionCell.value = null;
              if (!unitFormula) {
                unitCell.value = null;
              }
              quantityCell.value = null;
              Object.values(classificationMap).forEach((column) => row.getCell(column).value = null);
            }
          }
        };
        fillLinhaVivaMaterialRows(contexto.consumo || [], 44);
        fillLinhaVivaMaterialRows(contexto.sucata || [], 61, "AK", "T", 15, {
          BOM: "Y",
          SUCATA: "AB",
          DESCARTE: "AE",
          REFORMA: "AH",
        });
      }

      const findRowByText = (text: string) => {
        const needle = text.trim().toUpperCase();
        for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber++) {
          const row = sheet.getRow(rowNumber);
          for (let column = 1; column <= sheet.columnCount; column++) {
            const value = extractCellText(row.getCell(column).value).trim().toUpperCase();
            if (value.includes(needle)) {
              return rowNumber;
            }
          }
        }
        return null;
      };

      const rodapeRowNumber = findRowByText("Planilha gerada em");
      if (rodapeRowNumber) {
        const rodapeRow = sheet.getRow(rodapeRowNumber);
        rodapeRow.getCell(1).value = `Planilha gerada em ${new Date().toLocaleString("pt-BR")} | Sistema de Gestão de Obras`;
      }

      hiddenSheetSnapshots.forEach((snapshot, sheetName) => {
        const hiddenSheet = workbook.getWorksheet(sheetName);
        if (hiddenSheet) {
          restoreHiddenSheetSnapshot(hiddenSheet, snapshot);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const fileName = `Orcamento_${contexto.selectedItemSnapshot.codigo_acionamento || "acionamento"}_${contexto.medicaoTab}_${Date.now()}.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMaterialInfo("Excel gerado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao exportar Excel", error);
      alert(`Erro ao gerar Excel: ${error?.message || error}`);
      setMaterialError(`Erro ao gerar Excel: ${error?.message || error}`);
    }
  };

  const gerarOrcamentoLayoutEng = async () => {
    if (!selectedItem) {
      alert("Nenhum acionamento selecionado");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      alert("ID do acionamento não encontrado");
      return;
    }

    const pdfModalidade: "LM" | "LV" = medicaoTab === "LM" ? "LM" : "LV";
    if (!equipeValidaParaLinha(pdfModalidade)) {
      alert(`Selecione uma equipe de ${pdfModalidade === "LM" ? "Linha Morta" : "Linha Viva"} vílida antes de gerar o PDF.`);
      return;
    }

    alert("Iniciando geração de PDF (layout EngElétrica)...");

    try {
      const contexto = await prepararOrcamentoContext(idAcionamento, pdfModalidade);
      if (!contexto) return;
      const resumoMO = calcularResumoMaoDeObra(contexto);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 10;
      let cursorY = 15;
      const isLinhaViva = contexto.pdfModalidade === "LV";
      const primary = isLinhaViva ? { r: 18, g: 92, b: 68 } : { r: 204, g: 0, b: 0 };
      const accent = isLinhaViva ? { r: 240, g: 252, b: 246 } : { r: 250, g: 250, b: 250 };
      const secondary = isLinhaViva ? { r: 12, g: 64, b: 46 } : { r: 140, g: 0, b: 0 };

      const ensureSpace = (minHeight = 40) => {
        if (cursorY + minHeight > pageHeight - 15) {
          doc.addPage();
          cursorY = 15;
        }
      };

      const drawFooter = () => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(secondary.r, secondary.g, secondary.b);
        doc.text("EngElétrica Assessoria Projetos e Construção LTDA", pageWidth / 2, pageHeight - 8, {
          align: "center",
        });
      };

      const drawSectionHeader = (title: string) => {
        ensureSpace();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primary.r, primary.g, primary.b);
        doc.text(title.toUpperCase(), marginX, cursorY);
        doc.setDrawColor(primary.r, primary.g, primary.b);
        doc.setLineWidth(0.4);
        doc.line(marginX, cursorY + 1.5, pageWidth - marginX, cursorY + 1.5);
        cursorY += 6;
      };

      const drawCampo = (label: string, value: string, x: number, y: number, width: number) => {
        const texto = value && value.trim() ? value : "--";
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.setDrawColor(217, 217, 217);
        const linhas = doc.splitTextToSize(texto, width - 6);
        const height = Math.max(12, 6 + linhas.length * 4);
        doc.rect(x, y, width, height, "F");
        doc.setFillColor(primary.r, primary.g, primary.b);
        doc.rect(x, y, 2, height, "F");
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(label.toUpperCase(), x + 3, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        let textY = y + 9;
        linhas.forEach((linha) => {
          doc.text(linha, x + 3, textY);
          textY += 4;
        });
        return height + 3;
      };

      const drawCamposGrid = (fields: { label: string; value: string; span?: number }[], columns = 3) => {
        const contentWidth = pageWidth - marginX * 2;
        const gap = 4;
        const colWidth = (contentWidth - gap * (columns - 1)) / columns;
        let rowY = cursorY;
        let currentCol = 0;
        let rowHeight = 0;

        fields.forEach((field) => {
          const span = Math.min(field.span || 1, columns);
          if (span === columns) {
            if (currentCol !== 0) {
              rowY += rowHeight;
              currentCol = 0;
              rowHeight = 0;
            }
          } else if (currentCol + span > columns) {
            rowY += rowHeight;
            currentCol = 0;
            rowHeight = 0;
          }

          const width = span === columns ? contentWidth : colWidth * span + gap * (span - 1);
          const x = marginX + currentCol * (colWidth + gap);
          const heightUsed = drawCampo(field.label, field.value, x, rowY, width);
          rowHeight = Math.max(rowHeight, heightUsed);
          currentCol += span;
          if (currentCol >= columns) {
            rowY += rowHeight;
            currentCol = 0;
            rowHeight = 0;
          }
        });

        if (currentCol !== 0) {
          rowY += rowHeight;
        }
        cursorY = rowY + 4;
      };

      // Header logo/title
      try {
        const logoImg = await loadImageElement(logoEngeletrica);
        doc.addImage(logoImg, "PNG", marginX, cursorY, 35, 15);
      } catch (error) {
        console.warn("Logo não pode ser carregada no layout EngElétrica", error);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(primary.r, primary.g, primary.b);
      doc.text(
        `Fechamento ${contexto.pdfModalidade === "LV" ? "Linha Viva (LV)" : "Linha Morta (LM)"}`,
        pageWidth / 2,
        cursorY + 12,
        { align: "center" }
      );
      doc.setLineWidth(1.2);
      doc.setDrawColor(primary.r, primary.g, primary.b);
      doc.line(marginX, cursorY + 18, pageWidth - marginX, cursorY + 18);
      cursorY += 24;

      // Dados da ordem
      drawSectionHeader("Dados da Ordem");
      drawCamposGrid(
        [
          { label: "Nº Intervenção", value: contexto.numeroSigod || contexto.numeroIntervencaoTexto || "--" },
          { label: "Cód Acionamento", value: contexto.codigoAcionamento },
          { label: "OS Tablet", value: contexto.osTabletTexto },
          { label: "Endereço", value: contexto.enderecoTexto, span: 3 },
        ]
      );

      // Equipe e logística
      const dadosExec = contexto.dadosExec;
      const formatDuracao = (inicio?: string | null, fim?: string | null) => {
        if (!inicio || !fim) return "--";
        const start = new Date(inicio);
        const end = new Date(fim);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return "--";
        const diff = end.getTime() - start.getTime();
        if (diff <= 0) return "--";
        const horas = Math.floor(diff / 3600000);
        const minutos = Math.floor((diff % 3600000) / 60000);
        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
      };
      const formatKmValor = (valor?: string | number | null) => {
        if (valor === null || valor === undefined || valor === "") return "--";
        const numero = Number(valor);
        if (!isNaN(numero)) return `${numero.toFixed(2)} km`;
        if (typeof valor === "string" && valor.trim().length > 0) return valor.trim();
        return "--";
      };

      const kmInicial = formatKmValor(dadosExec?.km_inicial);
      const kmFinal = formatKmValor(dadosExec?.km_final);
      const saidaBaseTexto = formatDateTimeBr(dadosExec?.saida_base);
      const retornoBaseTexto = formatDateTimeBr(dadosExec?.retorno_base);
      const inicioServicoTexto = formatDateTimeBr(dadosExec?.inicio_servico);
      const retornoServicoTexto = formatDateTimeBr(dadosExec?.retorno_servico);
      const kmRodados = (() => {
        const kmTotal = Number(dadosExec?.km_total);
        if (!isNaN(kmTotal) && kmTotal > 0) return `${kmTotal.toFixed(2)} km`;
        const inicial = Number(dadosExec?.km_inicial);
        const final = Number(dadosExec?.km_final);
        if (!isNaN(inicial) && !isNaN(final) && final > inicial) {
          return `${(final - inicial).toFixed(2)} km`;
        }
        return "--";
      })();
      drawSectionHeader("Equipe e Logística");
      drawCamposGrid(
        [
          { label: "Equipe", value: contexto.equipeTexto },
          { label: "Encarregado", value: contexto.encarregadoTexto },
          { label: "Técnico Eng.", value: contexto.tecnicoTexto || contexto.currentUserNameSnapshot || "--" },
          { label: "Data", value: contexto.dataExecucaoTexto },
          { label: "Saída Base", value: saidaBaseTexto },
          { label: "Retorno Base", value: retornoBaseTexto },
          { label: "Tempo Base", value: formatDuracao(dadosExec?.saida_base, dadosExec?.retorno_base) },
          { label: "Início Serviço", value: inicioServicoTexto },
          { label: "Retorno Serviço", value: retornoServicoTexto },
          { label: "Tempo Serviço", value: formatDuracao(dadosExec?.inicio_servico, dadosExec?.retorno_servico) },
          { label: "KM Inicial", value: kmInicial },
          { label: "KM Final", value: kmFinal },
          { label: "KM Rodados", value: kmRodados },
        ]
      );

      const possuiInfoTransformador = (() => {
        if (dadosExec?.troca_transformador) return true;
        const campos = [
          dadosExec?.trafo_ret_marca,
          dadosExec?.trafo_ret_potencia,
          dadosExec?.trafo_ret_ano,
          dadosExec?.trafo_ret_tensao_primaria,
          dadosExec?.trafo_ret_tensao_secundaria,
          dadosExec?.trafo_ret_numero_serie,
          dadosExec?.trafo_ret_patrimonio,
          dadosExec?.trafo_inst_potencia,
          dadosExec?.trafo_inst_marca,
          dadosExec?.trafo_inst_ano,
          dadosExec?.trafo_inst_tensao_primaria,
          dadosExec?.trafo_inst_tensao_secundaria,
          dadosExec?.trafo_inst_numero_serie,
          dadosExec?.trafo_inst_patrimonio,
        ];
        return campos.some((valor) => typeof valor === "number" || (typeof valor === "string" && valor.trim().length > 0));
      })();

      if (possuiInfoTransformador) {
        drawSectionHeader("Transformador Retirado / Instalado");
        const trafoRows = [
          ["Marca", dadosExec?.trafo_ret_marca || "-", dadosExec?.trafo_inst_marca || "-"],
          ["Potência", dadosExec?.trafo_ret_potencia || "-", dadosExec?.trafo_inst_potencia || "-"],
          ["Nº Série", dadosExec?.trafo_ret_numero_serie || "-", dadosExec?.trafo_inst_numero_serie || "-"],
          ["Tensão Primária", dadosExec?.trafo_ret_tensao_primaria || "-", dadosExec?.trafo_inst_tensao_primaria || "-"],
          ["Tensão Secundária", dadosExec?.trafo_ret_tensao_secundaria || "-", dadosExec?.trafo_inst_tensao_secundaria || "-"],
          ["Fabricado", dadosExec?.trafo_ret_ano || "-", dadosExec?.trafo_inst_ano || "-"],
          ["Patrimonio", dadosExec?.trafo_ret_patrimonio || "-", dadosExec?.trafo_inst_patrimonio || "-"],
        ];
        autoTable(doc, {
          startY: cursorY,
          head: [["Campo", "Retirado", "Instalado"]],
          body: trafoRows,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [primary.r, primary.g, primary.b], textColor: 255 },
          theme: "grid",
          margin: { left: marginX, right: marginX },
        });
        cursorY = (doc as any).lastAutoTable.finalY + 6;
      }

      const possuiInfoTensoes = (() => {
        const campos = [
          dadosExec?.tensao_an,
          dadosExec?.tensao_bn,
          dadosExec?.tensao_cn,
          dadosExec?.tensao_ab,
          dadosExec?.tensao_bc,
          dadosExec?.tensao_ca,
        ];
        return campos.some((valor) => typeof valor === "number" || (typeof valor === "string" && valor.trim().length > 0));
      })();

      if (possuiInfoTensoes) {
        drawSectionHeader("Tensães Medidas");
        drawCamposGrid(
          [
            { label: "A-N", value: dadosExec?.tensao_an || "--" },
            { label: "B-N", value: dadosExec?.tensao_bn || "--" },
            { label: "C-N", value: dadosExec?.tensao_cn || "--" },
            { label: "A-B", value: dadosExec?.tensao_ab || "--" },
            { label: "B-C", value: dadosExec?.tensao_bc || "--" },
            { label: "A-C", value: dadosExec?.tensao_ca || "--" },
          ],
          3
        );
      }

      // Mão de obra
      drawSectionHeader("Mão de Obra");
      const subtotalRowStyles = isLinhaViva
        ? { fillColor: [225, 242, 236], textColor: [12, 64, 46], fontStyle: "bold" as const }
        : { fillColor: [255, 245, 234], textColor: [120, 60, 0], fontStyle: "bold" as const };
      const totalRowStyles = isLinhaViva
        ? { fillColor: [12, 64, 46], textColor: [255, 255, 255], fontStyle: "bold" as const }
        : { fillColor: [153, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" as const };
      const makeHighlightRow = (label: string, value: string, tipo: "subtotal" | "total" = "subtotal") => {
        const baseStyles = tipo === "total" ? totalRowStyles : subtotalRowStyles;
        const cells = Array.from({ length: 9 }, () => ({ content: "", styles: { ...baseStyles } }));
        cells[2] = { content: label, styles: { ...baseStyles } };
        cells[8] = { content: value, styles: { ...baseStyles, halign: "right" as const } };
        return cells;
      };

      const formatMoeda = (valor: number) =>
        new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);

      const bodyMO = resumoMO.itensCalculados.map((item) => {
        const operacao = (item.operacao || "").toLowerCase();
        const retQtd = operacao.includes("ret") ? item.quantidade.toFixed(2) : "";
        const instQtd = !retQtd ? item.quantidade.toFixed(2) : "";
        return [
          item.index,
          item.codigo,
          item.descricao,
          item.unidade,
          item.upsQtd.toFixed(2),
          retQtd,
          instQtd || item.quantidade.toFixed(2),
          item.quantidade.toFixed(2),
          formatMoeda(item.subtotal),
        ];
      });
      if (resumoMO.totalBase > 0.005) {
        bodyMO.push(makeHighlightRow("Subtotal mão de obra", formatMoeda(resumoMO.totalBase), "subtotal"));
      }
      if (resumoMO.acrescimoValor > 0.005) {
        const upsAdicionalLabel = formatMoeda(resumoMO.acrescimoValor);
        bodyMO.push([
          "",
          resumoMO.acrescimoInfo.codigo,
          resumoMO.acrescimoInfo.descricao,
          "UN",
          upsAdicionalLabel,
          "",
          "",
          "1.00",
          formatMoeda(resumoMO.acrescimoValor),
        ]);
      }
      bodyMO.push(makeHighlightRow("TOTAL GERAL", formatMoeda(resumoMO.totalComAdicional), "total"));

      autoTable(doc, {
        startY: cursorY,
        head: [["Item", "Cód", "Descrição", "Un", "UPS", "Ret", "Inst", "Qtd", "R$"]],
        body: bodyMO,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [primary.r, primary.g, primary.b], textColor: 255 },
        theme: "grid",
        margin: { left: marginX, right: marginX },
      });
      cursorY = (doc as any).lastAutoTable.finalY + 10;

      drawFooter();

      // Página 2 - materiais
      if (contexto.consumo.length > 0 || contexto.sucata.length > 0) {
        doc.addPage();
        cursorY = 15;

        if (contexto.consumo.length > 0) {
          drawSectionHeader("Material Aplicado");
          autoTable(doc, {
            startY: cursorY,
            head: [["Item", "Cód", "Material", "UN", "Qtd"]],
            body: contexto.consumo.map((c, idx) => [
              idx + 1,
              c.codigo_material,
              c.descricao_item || "",
              c.unidade_medida || "",
              Number(c.quantidade || 0).toFixed(2),
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [primary.r, primary.g, primary.b], textColor: 255 },
            theme: "grid",
            margin: { left: marginX, right: marginX },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 8;
        }

        if (contexto.sucata.length > 0) {
          drawSectionHeader("Material Retirado");
          autoTable(doc, {
            startY: cursorY,
            head: [["Item", "Cód", "Material", "UN", "Class.", "Qtd"]],
            body: contexto.sucata.map((s, idx) => [
              idx + 1,
              s.codigo_material,
              s.descricao_item || "",
              s.unidade_medida || "",
              s.classificacao || "-",
              Number(s.quantidade || 0).toFixed(2),
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [primary.r, primary.g, primary.b], textColor: 255 },
            theme: "grid",
            margin: { left: marginX, right: marginX },
          });
          cursorY = (doc as any).lastAutoTable.finalY + 8;
        }

        drawFooter();
      }

      const nomeArquivo = `Fechamento_Eng_${contexto.selectedItemSnapshot.codigo_acionamento || "acionamento"}_${contexto.medicaoTab}_${Date.now()}.pdf`;
      const pdfBlob = doc.output("blob");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alert("PDF (layout EngElétrica) gerado!");
      setMaterialInfo("PDF (layout EngElétrica) gerado!");
      registrarPdfGerado(contexto.pdfModalidade);
    } catch (error: any) {
      alert(`ERRO: ${error?.message}`);
      console.error("ERRO layout EngElétrica:", error);
      setMaterialInfo(`Erro (layout EngElétrica): ${error?.message}`);
    }
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
      setCurrentUserId(user?.id || null);

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
          "id_acionamento,codigo_acionamento,numero_os,os_criada_em,book_enviado_em,numero_obra,numero_obra_atualizado_em,elemento_id,status,prioridade,municipio,modalidade,data_abertura,data_despacho,etapa_atual,encarregado,almox_conferido_em,assinatura_fiscal_em,tci_criado_em,medicao_aprovada_em,medicao_aprovacao_status"
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

      const trafoRequired = [

        "trafo_ret_potencia",

        "trafo_ret_marca",

        "trafo_ret_tensao_secundaria",

        "trafo_ret_tensao_primaria",

        "trafo_inst_potencia",

        "trafo_inst_tensao_secundaria",

        "trafo_inst_tensao_primaria",

      ];

      for (const key of trafoRequired) {

        if (!f[key] && f[key] !== 0) {

          return "Preencha os dados essenciais do transformador informado.";

        }

      }

      const temValor = (valor: any) => {
        if (valor === 0) return true;
        if (valor === null || valor === undefined) return false;
        if (typeof valor === "string") {
          return valor.trim().length > 0;
        }
        return true;
      };

      const tensaoFields = [

        "tensao_an",

        "tensao_bn",

        "tensao_cn",

        "tensao_ab",

        "tensao_bc",

        "tensao_ca",

      ];

      const algumaTensaoPreenchida = tensaoFields.some((key) => temValor(f[key]));
      if (algumaTensaoPreenchida) {
        const tensaoIncompleta = tensaoFields.some((key) => !temValor(f[key]));
        if (tensaoIncompleta) {
          return "Informe todas as tensães (AN/BN/CN/AB/BC/CA) ou deixe todas em branco.";
        }
      }

    }

    return null;

  };

  const normalizeOptionalField = (value?: string | null) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return value;
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
        os_tablet: normalizeOptionalField(execForm.os_tablet),
        ss_nota: normalizeOptionalField(execForm.ss_nota),
        numero_intervencao: normalizeOptionalField(execForm.numero_intervencao),
        observacoes: normalizeOptionalField(execForm.observacoes),
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

  const openOsModal = async (item: any) => {
    setSelectedItem(item);
    setOsElementoId(item.elemento_id || "");
    setOsModalOpen(true);
    setOsLoading(true);
    setOsError(null);
    setOsInfo(null);
    setOsForm({
      numero_os: "",
      os_criada_em: toInputDateTime(new Date().toISOString()),
      observacoes: "",
    });

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }
      const { data, error } = await supabase
        .from("acionamentos")
        .select("numero_os,os_criada_em,observacao,elemento_id,codigo_acionamento")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (error) throw error;
      setOsForm({
        numero_os: data?.numero_os || "",
        os_criada_em: toInputDateTime(data?.os_criada_em || new Date().toISOString()),
        observacoes: data?.observacao || "",
      });
      setOsElementoId(data?.elemento_id || item.elemento_id || "");
      if (data) {
        setSelectedItem((prev: any) => {
          if (!prev) return prev;
          const prevId = prev.id_acionamento || prev.id;
          return prevId === idAcionamento
            ? {
                ...prev,
                numero_os: data.numero_os,
                os_criada_em: data.os_criada_em,
                observacao: data.observacao,
                elemento_id: data.elemento_id ?? prev.elemento_id,
                codigo_acionamento: data.codigo_acionamento ?? prev.codigo_acionamento,
              }
            : prev;
        });
      }
    } catch (err: any) {
      setOsError(err.message || "Erro ao carregar dados da OS.");
      setOsForm((prev) => ({ ...prev, os_criada_em: toInputDateTime(new Date().toISOString()) }));
    } finally {
      setOsLoading(false);
    }
  };

  const handleOsFormChange = (field: keyof typeof emptyOsForm, value: string) => {
    setOsForm((prev) => ({ ...prev, [field]: value }));
  };

  const salvarDadosOs = async () => {
    if (!selectedItem) {
      setOsError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setOsError("ID do acionamento não encontrado.");
      return;
    }
    if (!osForm.numero_os.trim()) {
      setOsError("Informe o número da OS.");
      return;
    }
    const osDataIso = fromInputDateTime(osForm.os_criada_em);
    if (!osDataIso) {
      setOsError("Informe a data e hora em que a OS foi criada.");
      return;
    }

    setOsSaving(true);
    setOsError(null);
    setOsInfo(null);

    try {
      const payload: any = {
        numero_os: osForm.numero_os.trim(),
        os_criada_em: osDataIso,
        observacao: osForm.observacoes?.trim() ? osForm.observacoes.trim() : null,
        etapa_atual: 5,
      };

      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) =>
        prev
          ? {
              ...prev,
              numero_os: payload.numero_os,
              os_criada_em: payload.os_criada_em,
              observacao: payload.observacao,
              etapa_atual: 5,
            }
          : prev
      );

      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 4) return { ...step, count: Math.max(0, step.count - 1) };
          if (step.id === 5) return { ...step, count: step.count + 1 };
          return step;
        })
      );

      setOsInfo("OS registrada e etapa avançada para 5.");

      setTimeout(closeOsModal, 800);
    } catch (err: any) {
      setOsError(err.message || "Erro ao salvar dados da OS.");
    } finally {
      setOsSaving(false);
    }
  };

  const handleFiscalFormChange = (value: string) => {
    setFiscalForm({ assinatura_fiscal_em: value });
  };

  const closeFiscalModal = () => {
    setFiscalModalOpen(false);
    setFiscalForm({ ...emptyFiscalForm });
    setFiscalError(null);
    setFiscalInfo(null);
    setFiscalLoading(false);
    setFiscalSaving(false);
  };

  const openFiscalModal = async (item: any) => {
    setSelectedItem(item);
    setFiscalModalOpen(true);
    setFiscalLoading(true);
    setFiscalError(null);
    setFiscalInfo(null);
    setFiscalForm({
      assinatura_fiscal_em: toInputDateTime(
        item.assinatura_fiscal_em || new Date().toISOString()
      ),
    });

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }
      const { data, error } = await supabase
        .from("acionamentos")
        .select("assinatura_fiscal_em")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (error) throw error;
      setFiscalForm({
        assinatura_fiscal_em: toInputDateTime(
          data?.assinatura_fiscal_em || item.assinatura_fiscal_em || new Date().toISOString()
        ),
      });
    } catch (err: any) {
      setFiscalError(err.message || "Erro ao carregar dados da aprovação fiscal.");
    } finally {
      setFiscalLoading(false);
    }
  };

  const salvarDadosFiscal = async () => {
    if (!selectedItem) {
      setFiscalError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setFiscalError("ID do acionamento não encontrado.");
      return;
    }
    const assinaturaIso = fromInputDateTime(fiscalForm.assinatura_fiscal_em);
    if (!assinaturaIso) {
      setFiscalError("Informe a data e hora da assinatura fiscal.");
      return;
    }

    setFiscalSaving(true);
    setFiscalError(null);
    setFiscalInfo(null);

    try {
      const etapaDestino = 7;
      const payload = {
        assinatura_fiscal_em: assinaturaIso,
        etapa_atual: etapaDestino,
      };
      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : prev
      );
      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 6) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          if (step.id === etapaDestino) {
            return { ...step, count: step.count + 1 };
          }
          return step;
        })
      );

      setFiscalInfo("Assinatura fiscal registrada com sucesso e etapa liberada.");
      setTimeout(() => closeFiscalModal(), 800);
    } catch (err: any) {
      setFiscalError(err.message || "Erro ao salvar aprovação fiscal.");
    } finally {
      setFiscalSaving(false);
    }
  };

  const handleTciFormChange = (value: string) => {
    setTciForm((prev) => ({ ...prev, tci_criado_em: value }));
  };

  const closeTciModal = () => {
    setTciModalOpen(false);
    setTciForm({ ...emptyTciForm });
    setTciError(null);
    setTciInfo(null);
    setTciLoading(false);
    setTciSaving(false);
  };

  const openTciModal = async (item: any) => {
    setSelectedItem(item);
    setTciModalOpen(true);
    setTciLoading(true);
    setTciError(null);
    setTciInfo(null);
    setTciForm({
      tci_numero: item.tci_numero || "",
      tci_criado_em: toInputDateTime(item.tci_criado_em || new Date().toISOString()),
    });

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }
      const { data, error } = await supabase
        .from("acionamentos")
        .select("tci_criado_em")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (error) throw error;
      setTciForm({
        tci_criado_em: toInputDateTime(data?.tci_criado_em || item.tci_criado_em || new Date().toISOString()),
      });
    } catch (err: any) {
      setTciError(err.message || "Erro ao carregar dados do TCI.");
    } finally {
      setTciLoading(false);
    }
  };

  const salvarDadosTci = async () => {
    if (!selectedItem) {
      setTciError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setTciError("ID do acionamento não encontrado.");
      return;
    }

    const criadoIso = fromInputDateTime(tciForm.tci_criado_em);
    if (!criadoIso) {
      setTciError("Informe a data e hora do TCI.");
      return;
    }

    setTciSaving(true);
    setTciError(null);
    setTciInfo(null);

    try {
      const etapaDestino = 8;
      const payload = {
        tci_criado_em: criadoIso,
        etapa_atual: etapaDestino,
      };
      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) => (prev ? { ...prev, ...payload } : prev));
      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 7) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          if (step.id === etapaDestino) {
            return { ...step, count: step.count + 1 };
          }
          return step;
        })
      );

      setTciInfo("TCI registrado com sucesso e etapa liberada.");
      setTimeout(() => closeTciModal(), 800);
    } catch (err: any) {
      setTciError(err.message || "Erro ao salvar o TCI.");
    } finally {
      setTciSaving(false);
    }
  };

  const closeAprovacaoModal = () => {
    setAprovacaoModalOpen(false);
    setAprovacaoLogForm({ ...emptyAprovacaoLogForm });
    setAprovacaoLogs([]);
    setAprovacaoError(null);
    setAprovacaoInfo(null);
    setAprovacaoLoading(false);
    setAprovacaoSaving(false);
  };

  const carregarResumoAprovacaoPreview = async (idAcionamento: string, itemSnapshot: any) => {
    const modalidades: Array<"LM" | "LV"> = ["LM", "LV"];
    const contextoPreview: Record<"LM" | "LV", OrcamentoPdfContext | null> = {
      LM: null,
      LV: null,
    };
    const resumoPreview: Record<"LM" | "LV", MaoDeObraResumo | null> = {
      LM: null,
      LV: null,
    };

    let medicaoRascunho: MedicaoRascunho | null = null;
    try {
      const { data } = await supabase
        .from("medicao_orcamentos")
        .select("itens_lm,itens_lv,fora_horario,valor_ups_lm,valor_ups_lv")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (data) {
        medicaoRascunho = {
          itens_lm: parseMedicaoItens(data.itens_lm),
          itens_lv: parseMedicaoItens(data.itens_lv),
          valor_ups_lm: Number(data.valor_ups_lm) || undefined,
          valor_ups_lv: Number(data.valor_ups_lv) || undefined,
          fora_horario: data.fora_horario ?? undefined,
        };
      }
    } catch (err) {
      console.warn("Falha ao carregar rascunho da medição para preview", err);
    }

    await Promise.all(
      modalidades.map(async (modalidade) => {
        try {
          const contexto = await prepararOrcamentoContext(
            idAcionamento,
            modalidade,
            itemSnapshot,
            medicaoRascunho || undefined
          );
          if (!contexto) {
            return;
          }
          contextoPreview[modalidade] = contexto;
          resumoPreview[modalidade] = calcularResumoMaoDeObra(contexto);
        } catch (err) {
          console.error("Erro ao preparar preview da aprovação da medição", err);
        }
      })
    );

    setAprovacaoContextoPreview(contextoPreview);
    setAprovacaoResumoPreview(resumoPreview);
    const modalidadesDisponiveis = obterModalidadesDisponiveis(contextoPreview);
    const preferencia = modalidadesDisponiveis[0] || (medicaoTab === "LM" ? "LM" : "LV");
    setAprovacaoPreviewModalidade(preferencia);
  };

  const openAprovacaoModal = async (item: any) => {
    setSelectedItem(item);
    setAprovacaoModalOpen(true);
    setAprovacaoLoading(true);
    setAprovacaoError(null);
    setAprovacaoInfo(null);
    setAprovacaoLogs([]);
    const defaultDate = toInputDateTime(new Date().toISOString()) || "";
    setAprovacaoLogForm({
      status: (item.medicao_aprovacao_status as AprovacaoStatus) || "aguardando",
      observacao: "",
      data: defaultDate,
    });

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }
      const { data: logs, error } = await supabase
        .from("medicao_aprovacao_logs")
        .select("id_log,status,observacao,criado_em")
        .eq("id_acionamento", idAcionamento)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      const fetched = logs || [];
      setAprovacaoLogs(fetched);
      setAprovacaoLogsPreview(fetched);
      await carregarResumoAprovacaoPreview(idAcionamento, item);
    } catch (err: any) {
      setAprovacaoError(err.message || "Erro ao carregar dados da aprovação da medição.");
    } finally {
      setAprovacaoLoading(false);
    }
  };

  const registrarAprovacaoLog = async (concluir: boolean) => {
    if (!selectedItem) {
      setAprovacaoError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setAprovacaoError("ID do acionamento não encontrado.");
      return;
    }

    const logDateIso =
      fromInputDateTime(aprovacaoLogForm.data) || new Date().toISOString();
    const payloadLog = {
      id_acionamento: idAcionamento,
      status: aprovacaoLogForm.status,
      observacao: aprovacaoLogForm.observacao.trim() || null,
      criado_em: logDateIso,
    };

    setAprovacaoSaving(true);
    setAprovacaoError(null);
    setAprovacaoInfo(null);

    try {
      const { data: insertedLog, error: logError } = await supabase
        .from("medicao_aprovacao_logs")
        .insert(payloadLog)
        .select()
        .single();
      if (logError) throw logError;
      if (!insertedLog) {
        throw new Error("Não foi possível registrar o status da medição.");
      }

      const statusUpdate = {
        medicao_aprovacao_status: aprovacaoLogForm.status,
        ...(concluir ? { medicao_aprovada_em: logDateIso, etapa_atual: 9 } : {}),
      };

      const { error: updateError } = await supabase
        .from("acionamentos")
        .update(statusUpdate)
        .eq("id_acionamento", idAcionamento);
      if (updateError) throw updateError;

      const logEntry: AprovacaoLog = (insertedLog as unknown) as AprovacaoLog;

      setAprovacaoLogs((prev) => [logEntry, ...prev]);

      if (concluir) {
        setSelectedItem((prev: any) =>
          prev ? { ...prev, ...statusUpdate } : prev
        );
        setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));

        setSteps((prev) =>
          prev.map((step) => {
            if (step.id === 8) {
              return { ...step, count: Math.max(0, step.count - 1) };
            }
            if (step.id === 9) {
              return { ...step, count: step.count + 1 };
            }
            return step;
          })
        );

        setAprovacaoInfo("Medição aprovada e etapa liberada.");
        setTimeout(() => closeAprovacaoModal(), 800);
      } else {
        setSelectedItem((prev: any) =>
          prev ? { ...prev, medicao_aprovacao_status: aprovacaoLogForm.status } : prev
        );
        setItems((prev) =>
          prev.map((it) =>
            it.id_acionamento === idAcionamento
              ? { ...it, medicao_aprovacao_status: aprovacaoLogForm.status }
              : it
          )
        );
        setAprovacaoInfo("Status registrado com sucesso.");
      }

      setAprovacaoLogForm({
        ...aprovacaoLogForm,
        observacao: "",
        data: toInputDateTime(new Date().toISOString()) || "",
      });
    } catch (err: any) {
      setAprovacaoError(
        err.message || "Erro ao registrar o status da aprovação da medição."
      );
    } finally {
      setAprovacaoSaving(false);
    }
  };

  const salvarDadosAprovacao = async () => {
    await registrarAprovacaoLog(true);
  };

  const fetchValorFinalAprovado = async (idAcionamento: string) => {
    const { data, error } = await supabase
      .from("medicao_retorno_items")
      .select("total_valor")
      .eq("id_acionamento", idAcionamento)
      .eq("origem", "APROVADO");
    if (error) throw error;
    return (data || []).reduce(
      (sum, row: any) => sum + (Number(row.total_valor) || 0),
      0
    );
  };

  const handleOpenEtapa9Modal = async (item: any) => {
    setSelectedItem(item);
    setEtapa9ModalOpen(true);
    setEtapa9Error(null);
    setEtapa9NumeroLote("");
    setEtapa9Ciclo("");
    setEtapa9DataEmissao(new Date().toISOString().slice(0, 10));
    setEtapa9Observacao("");
    setEtapa9Confirmado(false);
    setEtapa9ValorFinal(null);
    setEtapa9Loading(true);
    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento inválido.");
      }
      const valor = await fetchValorFinalAprovado(idAcionamento);
      setEtapa9ValorFinal(valor);
    } catch (err: any) {
      setEtapa9Error(err?.message || "Não foi possível carregar o valor final.");
    } finally {
      setEtapa9Loading(false);
    }
  };

  const closeEtapa9Modal = () => {
    setEtapa9ModalOpen(false);
    setEtapa9Error(null);
  };

  const salvarEtapa9 = async () => {
    if (!selectedItem) {
      setEtapa9Error("Nenhum acionamento selecionado.");
      return;
    }
    if (!etapa9Confirmado) {
      setEtapa9Error("Confirme o pagamento para prosseguir.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setEtapa9Error("ID do acionamento inválido.");
      return;
    }
    setEtapa9Saving(true);
    setEtapa9Error(null);
    try {
      const { error } = await supabase
        .from("acionamentos")
        .update({ etapa_atual: 10 })
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) => (prev ? { ...prev, etapa_atual: 10 } : prev));
      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 9) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          if (step.id === 10) {
            return { ...step, count: step.count + 1 };
          }
          return step;
        })
      );
      setEtapa9ModalOpen(false);
    } catch (err: any) {
      setEtapa9Error(err?.message || "Erro ao registrar a etapa.");
    } finally {
      setEtapa9Saving(false);
    }
  };

  const handleOpenEtapa10Modal = async (item: any) => {
    setSelectedItem(item);
    setEtapa10ModalOpen(true);
    setEtapa10Error(null);
    setEtapa10NumeroNF("");
    setEtapa10DataEmissao(new Date().toISOString().slice(0, 10));
    setEtapa10Observacao("");
    setEtapa10ValorFinal(null);
    setEtapa10Loading(true);
    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento inválido.");
      }
      const valor = await fetchValorFinalAprovado(idAcionamento);
      setEtapa10ValorFinal(valor);
    } catch (err: any) {
      setEtapa10Error(err?.message || "Não foi possível carregar o valor final.");
    } finally {
      setEtapa10Loading(false);
    }
  };

  const closeEtapa10Modal = () => {
    setEtapa10ModalOpen(false);
    setEtapa10Error(null);
  };

  const salvarEtapa10 = async () => {
    if (!selectedItem) {
      setEtapa10Error("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setEtapa10Error("ID do acionamento inválido.");
      return;
    }
    setEtapa10Saving(true);
    setEtapa10Error(null);
    try {
      const { error } = await supabase
        .from("acionamentos")
        .update({ etapa_atual: 10 })
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) => (prev ? { ...prev, etapa_atual: 10 } : prev));
      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 10) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          return step;
        })
      );
      setEtapa10ModalOpen(false);
    } catch (err: any) {
      setEtapa10Error(err?.message || "Erro ao registrar a etapa.");
    } finally {
      setEtapa10Saving(false);
    }
  };

  const registrarStatusAprovacao = async () => {
    if (aprovacaoLogForm.status === "concluido") {
      setAprovacaoError("Use o botão de conclusão para finalizar a medição.");
      return;
    }
    await registrarAprovacaoLog(false);
  };

  const handleAprovacaoLogFieldChange = (field: keyof AprovacaoLogForm, value: string) => {
    setAprovacaoLogForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const closeOsModal = () => {
    setOsModalOpen(false);
    setOsForm({ ...emptyOsForm });
    setOsError(null);
    setOsInfo(null);
    setOsElementoId("");
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



  const resolvePreListaPdfContext = (): PreListaPdfContext | null => {
    if (!selectedItem) return null;

    if (preLista.length === 0) {
      setMaterialError("Nenhum item na pre-lista para gerar PDF.");
      return null;
    }

    const encBaseTodos = uniqueEncarregados(encarregadoNome || selectedItem?.encarregado || "");
    const precisaEscolher =
      (encBaseTodos.length > 1 && !encarregadoSelecionado) ||
      (encBaseTodos.length === 0 && !encarregadoSelecionado);

    if (precisaEscolher) {
      setMaterialError("Selecione um encarregado antes de gerar o PDF.");
      return null;
    }

    const encarregadoRaw = encarregadoSelecionado || encarregadoNome || selectedItem?.encarregado || "";
    const encarregadoAss = uniqueEncarregados(encarregadoRaw)[0] || "________________";
    const printedBy = currentUserName || "________________";

    return {
      acionamento: selectedItem,
      encarregadoAss,
      printedBy,
    };
  };

  const exportPreListaPdf = async () => {
    const context = resolvePreListaPdfContext();
    if (!context) return;

    const { acionamento, encarregadoAss, printedBy } = context;
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    let pageHeight = doc.internal.pageSize.getHeight();
    const primary: [number, number, number] = [185, 32, 36]; // vermelho escurecido da logo
    const accent: [number, number, number] = [245, 226, 227];
    const subtleRow: [number, number, number] = [252, 241, 242];

    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageWidth, 32, "F");
    try {
      const logoImg = await loadImageElement(logoEngeletrica);
      const logoWidth = 46;
      const aspectRatio = logoImg.width ? logoImg.height / logoImg.width : 0.32;
      const rawHeight = logoWidth * (aspectRatio || 0.32);
      const logoHeight = Math.min(22, Math.max(14, rawHeight));
      doc.setFillColor(255, 255, 255);
      const badgeX = 10;
      const badgeY = 5;
      doc.roundedRect(badgeX, badgeY, logoWidth + 10, logoHeight + 4, 4, 4, "F");
      doc.addImage(logoImg, "PNG", badgeX + 5, badgeY + 2, logoWidth, logoHeight);
    } catch (error) {
      console.warn("Logo não pode ser carregada para o layout alternativo da pré-lista", error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Lista de Materiais", pageWidth / 2, 18, { align: "center" });

    const statusLabel =
      typeof acionamento.status === "string" && acionamento.status.trim().length > 0
        ? acionamento.status.toUpperCase()
        : "Sem status";

    const infoBlocks = [
      { label: "Acionamento", value: acionamento.codigo_acionamento || acionamento.id_acionamento || "--" },
      { label: "Município", value: acionamento.municipio || "--" },
      { label: "Data", value: getDataTitulo() },
    ];

    const infoColumns = 3;
    const horizontalGap = 10;
    const verticalGap = 6;
    const blockWidth = (pageWidth - 24 - horizontalGap * (infoColumns - 1)) / infoColumns;
    const blockHeight = 16;
    const infoStartY = 36;

    infoBlocks.forEach((block, index) => {
      const col = index % infoColumns;
      const row = Math.floor(index / infoColumns);
      const x = 12 + col * (blockWidth + horizontalGap);
      const y = infoStartY + row * (blockHeight + verticalGap);
      doc.setFillColor(accent[0], accent[1], accent[2]);
      doc.setDrawColor(210, 218, 235);
      doc.roundedRect(x, y, blockWidth, blockHeight, 3, 3, "FD");
      doc.setTextColor(100, 112, 128);
      doc.setFontSize(7);
      doc.text(block.label.toUpperCase(), x + 3, y + 5);
      doc.setTextColor(22, 28, 36);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(block.value || "--", blockWidth - 6) as string[];
      doc.text(lines, x + 3, y + 11);
    });

    const infoRows = Math.ceil(infoBlocks.length / infoColumns);
    let sectionY = infoStartY + infoRows * (blockHeight + verticalGap) + 6;

    const descricaoServico =
      acionamento.descricao_servico ||
      acionamento.descricao ||
      acionamento.resumo_servico ||
      acionamento.resumo ||
      acionamento.observacao ||
      "";

    if (descricaoServico.trim().length > 0) {
      doc.setTextColor(100, 112, 128);
      doc.setFontSize(8);
      doc.text("Resumo do serviço", 12, sectionY);
      doc.setTextColor(33, 37, 41);
      doc.setFontSize(10);
      const resumoLines = doc.splitTextToSize(descricaoServico, pageWidth - 24) as string[];
      doc.text(resumoLines, 12, sectionY + 5);
      sectionY += 5 + resumoLines.length * 5 + 4;
    }

    autoTable(doc, {
      startY: sectionY,
      head: [["#", "Código", "Descrição", "UND", "Qtd"]],
      body: preLista.map((p, index) => [
        (index + 1).toString(),
        p.codigo_material,
        p.descricao_item || "",
        p.unidade_medida || "",
        p.quantidade_prevista,
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineWidth: 0.15,
        lineColor: [200, 205, 214],
      },
      headStyles: { fillColor: primary, textColor: 255 },
      alternateRowStyles: { fillColor: subtleRow },
      theme: "grid",
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        3: { halign: "center", cellWidth: 22 },
        4: { halign: "center", cellWidth: 22 },
      },
    });

    let finalY = (doc as any).lastAutoTable?.finalY || sectionY;
    if (finalY > pageHeight - 50) {
      doc.addPage("landscape");
      pageHeight = doc.internal.pageSize.getHeight();
      finalY = 30;
    }

    const signatureY = pageHeight - 28;
    const signatureWidth = (pageWidth - 160) / 2;

    doc.setDrawColor(190, 198, 210);
    doc.line(60, signatureY, 60 + signatureWidth, signatureY);
    doc.line(pageWidth - 60 - signatureWidth, signatureY, pageWidth - 60, signatureY);

    doc.setFontSize(10);
    doc.setTextColor(22, 28, 36);
    doc.text(printedBy, 60 + signatureWidth / 2, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 112, 128);
    doc.text("Responsável Almoxarifado", 60 + signatureWidth / 2, signatureY + 10, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(22, 28, 36);
    doc.text(encarregadoAss, pageWidth - 60 - signatureWidth / 2, signatureY + 5, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 112, 128);
    doc.text("Encarregado", pageWidth - 60 - signatureWidth / 2, signatureY + 10, { align: "center" });

    const fileId = acionamento.codigo_acionamento || acionamento.id_acionamento || "acionamento";
    doc.save(`pre-lista-${fileId}.pdf`);
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

  const handleStage5BookClick = async (item: any) => {
    setSelectedItem(item);
    setBookModalOpen(true);
    setBookTab("book");
    setBookTrafoData(null);
    setBookLoading(true);
    setBookError(null);
    setBookInfo(null);
    setBookForm({
      book_enviado_em: toInputDateTime(item.book_enviado_em || new Date().toISOString()),
      email_msg: item.email_msg || "",
    });
    setBookEmailStorageEnabled(true);

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }

      const baseFields = [
        "book_enviado_em",
        "email_msg",
        "elemento_id",
        "codigo_acionamento",
        "modalidade",
        "status",
        "prioridade",
        "municipio",
        "data_abertura",
        "data_despacho",
        "encarregado",
        "etapa_atual",
        "numero_os",
        "numero_obra",
        "almox_conferido_em",
      ];
      const emailFields = ["book_email_msg", "book_email_msg_name"];
      let bookData: any | null = null;
      let emailColumnsAvailable = true;
      const selectFields = (fields: string[]) => fields.join(",");

      try {
        const { data, error } = await supabase
          .from("acionamentos")
          .select(selectFields([...baseFields, ...emailFields]))
          .eq("id_acionamento", idAcionamento)
          .maybeSingle();
        if (error) throw error;
        bookData = data;
      } catch (fetchError: any) {
        const message = fetchError?.message || "";
        if (
          message.includes("book_email_msg") ||
          message.includes("book_email_msg_name")
        ) {
          emailColumnsAvailable = false;
          const { data, error } = await supabase
            .from("acionamentos")
            .select(selectFields(baseFields))
            .eq("id_acionamento", idAcionamento)
            .maybeSingle();
          if (error) throw error;
          bookData = data;
        } else {
          throw fetchError;
        }
      }

      setBookEmailStorageEnabled(emailColumnsAvailable);

      setBookForm({
        book_enviado_em: toInputDateTime(
          bookData?.book_enviado_em || item.book_enviado_em || new Date().toISOString()
        ),
        email_msg: bookData?.email_msg || "",
        email_attachment:
          emailColumnsAvailable &&
          bookData?.book_email_msg &&
          bookData?.book_email_msg_name
            ? {
                name: bookData.book_email_msg_name,
                data: bookData.book_email_msg,
              }
            : null,
      });

      let execucaoData: any = null;
      try {
        const { data: execData } = await supabase
          .from("acionamento_execucao")
          .select("*")
          .eq("id_acionamento", idAcionamento)
          .maybeSingle();
        execucaoData = execData;
      } catch (err) {
        console.warn("Não foi possível carregar dados de transformador para o book.", err);
      }
      setBookTrafoData(execucaoData || null);

      if (bookData) {
        setSelectedItem((prev: any) => {
          if (!prev) return prev;
          const prevId = prev.id_acionamento || prev.id;
          return prevId === idAcionamento
            ? {
                ...prev,
                book_enviado_em: bookData.book_enviado_em ?? prev.book_enviado_em,
                email_msg: bookData.email_msg ?? prev.email_msg,
                book_email_msg: bookData.book_email_msg ?? prev.book_email_msg,
                book_email_msg_name:
                  bookData.book_email_msg_name ?? prev.book_email_msg_name,
                elemento_id: bookData.elemento_id ?? prev.elemento_id,
                codigo_acionamento:
                  bookData.codigo_acionamento ?? prev.codigo_acionamento,
                modalidade: bookData.modalidade ?? prev.modalidade,
                status: bookData.status ?? prev.status,
                prioridade: bookData.prioridade ?? prev.prioridade,
                municipio: bookData.municipio ?? prev.municipio,
                data_abertura: bookData.data_abertura ?? prev.data_abertura,
                data_despacho: bookData.data_despacho ?? prev.data_despacho,
                encarregado: bookData.encarregado ?? prev.encarregado,
                etapa_atual: bookData.etapa_atual ?? prev.etapa_atual,
                numero_os: bookData.numero_os ?? prev.numero_os,
                numero_obra: bookData.numero_obra ?? prev.numero_obra,
                almox_conferido_em:
                  bookData.almox_conferido_em ?? prev.almox_conferido_em,
              }
            : prev;
        });
      }
    } catch (err: any) {
      setBookError(err.message || "Erro ao carregar informaçães do book.");
    } finally {
      setBookLoading(false);
    }
  };

  const closeBookModal = () => {
    setBookModalOpen(false);
    setBookForm({ ...emptyBookForm });
    setBookError(null);
    setBookInfo(null);
    setBookLoading(false);
    setBookTab("book");
    setBookTrafoData(null);
    setBookDitais({ ...emptyBookDitais });
    setBookTrafoPhotos(initialTrafoPhotos);
  };

  const salvarDadosBook = async () => {
    if (!selectedItem) {
      setBookError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setBookError("ID do acionamento não encontrado.");
      return;
    }

    const enviadoEmIso = fromInputDateTime(bookForm.book_enviado_em);
    if (!enviadoEmIso) {
      setBookError("Informe a data e a hora em que o book foi enviado.");
      return;
    }

    setBookSaving(true);
    setBookError(null);
    setBookInfo(null);

    try {
      const payloadBase: Record<string, any> = {
        book_enviado_em: enviadoEmIso,
        email_msg: bookForm.email_msg?.trim() ? bookForm.email_msg.trim() : null,
      };
      const emailPayload: Record<string, any> = {
        book_email_msg: bookForm.email_attachment?.data || null,
        book_email_msg_name: bookForm.email_attachment?.name || null,
      };

      let payload = { ...payloadBase };
      if (bookEmailStorageEnabled) {
        payload = { ...payload, ...emailPayload };
      }

      let columnsMissing = false;

      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", idAcionamento);
      if (error) {
        const message = error?.message || "";
        if (
          bookEmailStorageEnabled &&
          (message.includes("book_email_msg") || message.includes("book_email_msg_name"))
        ) {
          columnsMissing = true;
          setBookEmailStorageEnabled(false);
          const { error: fallbackError } = await supabase
            .from("acionamentos")
            .update(payloadBase)
            .eq("id_acionamento", idAcionamento);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }

      const committedPayload = columnsMissing ? payloadBase : payload;

      setSelectedItem((prev: any) => (prev ? { ...prev, ...committedPayload } : prev));
      setItems((prev) =>
        prev.map((it) => {
          const currId = it.id_acionamento || it.id;
          return currId === idAcionamento ? { ...it, ...committedPayload } : it;
        })
      );

      setBookInfo("Book registrado com sucesso.");
      setTimeout(() => closeBookModal(), 800);
    } catch (err: any) {
      setBookError(err.message || "Erro ao salvar informaçães do book.");
    } finally {
      setBookSaving(false);
    }
  };

  const handleNumeroObraFormChange = (
    field: keyof typeof emptyNumeroObraForm,
    value: string
  ) => {
    setNumeroForm((prev) => ({ ...prev, [field]: value }));
  };

  const closeNumeroObraModal = () => {
    setNumeroModalOpen(false);
    setNumeroForm({ ...emptyNumeroObraForm });
    setNumeroError(null);
    setNumeroInfo(null);
    setNumeroLoading(false);
  };

  const openNumeroObraModal = async (item: any) => {
    if (!item?.book_enviado_em) {
      alert("Finalize o book e registre a data de envio para a Energisa antes de inserir o número da obra.");
      return;
    }
    setSelectedItem(item);
    setNumeroModalOpen(true);
    setNumeroLoading(true);
    setNumeroError(null);
    setNumeroInfo(null);
    setNumeroForm({
      numero_obra: item.numero_obra || "",
      numero_obra_atualizado_em: toInputDateTime(
        item.numero_obra_atualizado_em || new Date().toISOString()
      ),
    });

    try {
      const idAcionamento = item.id_acionamento || item.id;
      if (!idAcionamento) {
        throw new Error("ID do acionamento não encontrado.");
      }
      const { data, error } = await supabase
        .from("acionamentos")
        .select("numero_obra,numero_obra_atualizado_em,elemento_id")
        .eq("id_acionamento", idAcionamento)
        .maybeSingle();
      if (error) throw error;
      setNumeroForm({
        numero_obra: data?.numero_obra || "",
        numero_obra_atualizado_em: toInputDateTime(
          data?.numero_obra_atualizado_em || new Date().toISOString()
        ),
      });
      if (data) {
        setSelectedItem((prev: any) => {
          if (!prev) return prev;
          const prevId = prev.id_acionamento || prev.id;
          return prevId === idAcionamento
            ? {
                ...prev,
                numero_obra: data.numero_obra ?? prev.numero_obra,
                numero_obra_atualizado_em:
                  data.numero_obra_atualizado_em ?? prev.numero_obra_atualizado_em,
                elemento_id: data.elemento_id ?? prev.elemento_id,
              }
            : prev;
        });
      }
    } catch (err: any) {
      setNumeroError(err.message || "Erro ao carregar número da obra.");
    } finally {
      setNumeroLoading(false);
    }
  };

  const salvarNumeroObra = async () => {
    if (!selectedItem) {
      setNumeroError("Nenhum acionamento selecionado.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setNumeroError("ID do acionamento não encontrado.");
      return;
    }
    const numero = numeroForm.numero_obra.trim();
    if (!numero) {
      setNumeroError("Informe o número da obra.");
      return;
    }

    const atualizadoEmIso =
      fromInputDateTime(numeroForm.numero_obra_atualizado_em) || new Date().toISOString();

    setNumeroSaving(true);
    setNumeroError(null);
    setNumeroInfo(null);

    try {
      const etapaDestino = 6;
      const payload = {
        numero_obra: numero,
        numero_obra_atualizado_em: atualizadoEmIso,
        etapa_atual: etapaDestino,
      };
      const { error } = await supabase
        .from("acionamentos")
        .update(payload)
        .eq("id_acionamento", idAcionamento);
      if (error) throw error;

      setSelectedItem((prev: any) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : prev
      );
      setItems((prev) => prev.filter((it) => it.id_acionamento !== idAcionamento));

      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 5) {
            return { ...step, count: Math.max(0, step.count - 1) };
          }
          if (step.id === etapaDestino) {
            return { ...step, count: step.count + 1 };
          }
          return step;
        })
      );

      setNumeroInfo("Número da obra atualizado com sucesso e etapa liberada.");
      setTimeout(() => closeNumeroObraModal(), 800);
    } catch (err: any) {
      setNumeroError(err.message || "Erro ao salvar número da obra.");
    } finally {
      setNumeroSaving(false);
    }
  };



  const stepsMap = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps]);

  const openAcionamentoModal = useCallback(
    (item: any) => {
      const defaultStep = stepsMap.get(1) || workflowSteps[0];
      setSelectedItem(item);
      if (defaultStep) {
        setSelectedStep(defaultStep);
      }
      setOpen(true);
    },
    [stepsMap]
  );

  const openEditModal = useCallback((item: any) => {
    setSelectedItem(item);
    setEditForm({
      modalidade: item.modalidade || "",
      status: item.status || "",
      prioridade: item.prioridade || "",
      municipio: item.municipio || "",
      endereco: item.endereco || "",
      encarregado: item.encarregado || "",
      numero_os: item.numero_os || "",
      data_abertura: item.data_abertura || "",
      data_despacho: item.data_despacho || "",
      data_execucao: item.data_execucao || "",
      observacao: item.observacao || "",
    });
    setEditModalOpen(true);
  }, []);

  const handleEditSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!selectedItem) return;
      setEditSaving(true);
      setEditError(null);
      const payload = {
        modalidade: editForm.modalidade || undefined,
        status: editForm.status || undefined,
        prioridade: editForm.prioridade || undefined,
        municipio: editForm.municipio || undefined,
        endereco: editForm.endereco || undefined,
        encarregado: editForm.encarregado || undefined,
        numero_os: editForm.numero_os || undefined,
        data_abertura: editForm.data_abertura || undefined,
        data_despacho: editForm.data_despacho || undefined,
        data_execucao: editForm.data_execucao || undefined,
        observacao: editForm.observacao || undefined,
      };
      try {
        const { error } = await supabase
          .from("acionamentos")
          .update(payload)
          .eq("id_acionamento", selectedItem.id_acionamento);
        if (error) throw error;
        setSelectedItem((prev) => (prev ? { ...prev, ...payload } : prev));
        setEditModalOpen(false);
      } catch (err: any) {
        setEditError(err.message || "Erro ao salvar acionamento.");
      } finally {
        setEditSaving(false);
      }
    },
    [editForm, selectedItem]
  );

  const modalContextValue = useMemo(
    () => ({
      openAcionamento: openAcionamentoModal,
    }),
    [openAcionamentoModal]
  );

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      if (event?.detail?.item) {
        openAcionamentoModal(event.detail.item);
      }
    };
    window.addEventListener("workflow:open-item", handler as EventListener);
    return () => window.removeEventListener("workflow:open-item", handler as EventListener);
  }, [openAcionamentoModal]);

  const handleStepClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setOpen(true);
  };



  const formatDateBr = (date?: string | null) => {

    if (!date) return "--";

    const d = new Date(date);

    return isNaN(d.getTime()) ? "--" : d.toLocaleDateString("pt-BR");

  };



  const formatDateTimeBr = (date?: string | null) => {
    if (!date) return "--";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "--" : d.toLocaleString("pt-BR");
  };

  const parseDateForExcel = (input?: string | null) => {
    if (!input) return null;
    const normalized = input.trim();
    const iso = new Date(normalized);
    if (!isNaN(iso.getTime())) return iso;
    const match = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return null;
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
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

    const filteredItems = items.filter((item) => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) {
        return true;
      }

      const codigo = (item.codigo_acionamento || item.id_acionamento || "").toString().toLowerCase();
      const municipio = (item.municipio || "").toString().toLowerCase();
      const modalidade = (item.modalidade || "").toString().toLowerCase();
      const numeroObra = (item.numero_obra || "").toString().toLowerCase();

      return (
        codigo.includes(term) ||
        municipio.includes(term) ||
        modalidade.includes(term) ||
        numeroObra.includes(term)
      );
    });

    if (filteredItems.length === 0) {
      return <div className="text-sm text-muted-foreground">Nenhum item nesta etapa.</div>;
    }

    return filteredItems.map((item) => {

      return (
        <div
          key={item.id_acionamento}
          className="border border-border rounded-lg p-3 space-y-2 bg-card text-foreground"
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className="cursor-pointer"
              onClick={() =>
                navigate(`/acionamentos/${item.codigo_acionamento || item.id_acionamento}`)
              }
            >
              <div className="font-semibold text-foreground">
                {item.codigo_acionamento || item.id_acionamento}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.municipio || "--"} {item.modalidade || "--"}
              </div>
              {item.numero_os ? (
                <div className="text-[11px] text-emerald-600 font-semibold">
                  OS registrada: {item.numero_os}
                </div>
              ) : selectedStep?.id === 4 ? (
                <div className="text-[11px] text-amber-600">OS pendente nesta etapa</div>
              ) : null}
              {item.book_enviado_em ? (
                <div className="text-[11px] text-blue-600">
                  Book enviado em {formatDateTimeBr(item.book_enviado_em)}
                </div>
              ) : selectedStep?.id === 5 ? (
                <div className="text-[11px] text-blue-600">Book pendente nesta etapa</div>
              ) : null}
              {item.numero_obra ? (
                <div className="text-[11px] text-blue-700 font-semibold">
                  Nº obra: {item.numero_obra}
                </div>
              ) : selectedStep?.id === 5 ? (
                <div className="text-[11px] text-amber-600">Nº da obra pendente</div>
              ) : null}
              {item.assinatura_fiscal_em ? (
                <div className="text-[11px] text-emerald-600 font-semibold">
                  Fiscal aprovado em {formatDateTimeBr(item.assinatura_fiscal_em)}
                </div>
              ) : selectedStep?.id === 6 ? (
                <div className="text-[11px] text-amber-600">Aguardando aprovação fiscal</div>
              ) : null}
              {item.tci_criado_em ? (
                <div className="text-[11px] text-emerald-600 font-semibold">
                  TCI formalizado em {formatDateTimeBr(item.tci_criado_em)}
                </div>
              ) : selectedStep?.id === 7 ? (
                <div className="text-[11px] text-amber-600">TCI pendente nesta etapa</div>
              ) : null}
              {item.medicao_aprovada_em ? (
                <div className="text-[11px] text-emerald-600 font-semibold">
                  Medição aprovada em {formatDateTimeBr(item.medicao_aprovada_em)}
                </div>
              ) : selectedStep?.id === 8 ? (
                <div className="text-[11px] text-amber-600">Aguardando aprovação da medição</div>
              ) : null}
              {item.medicao_aprovacao_status ? (
                <div className="text-[11px] text-muted-foreground">
                  Status da aprovação:{" "}
                  {APROVACAO_STATUS_LABELS[
                    item.medicao_aprovacao_status as AprovacaoStatus
                  ] ?? item.medicao_aprovacao_status}
                </div>
              ) : null}
            </div>
            <Badge variant="outline" className="capitalize">
              {item.status || "--"}
            </Badge>
          </div>

          {renderStepActions(selectedStep?.id || 0, item)}
        </div>
      );
    });
  };

  const renderStepActions = (stepId: number, item: any) => {
    const baseEditAction = (
      <Button
        key="edit"
        size="sm"
        variant="outline"
          onClick={() => {
            openEditModal(item);
            setOpen(false);
          }}
      >
        Editar acionamento
      </Button>
    );

    const bookRegistrado = Boolean(item.book_enviado_em);
    const actions: JSX.Element[] = [];

    if (stepId === 1 || stepId === 2) {
      actions.push(
        <Button
          key="list"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedItem(item);
            openMaterialsModal(item);
          }}
        >
          Lista de materiais
        </Button>
      );
      if (stepId === 2) {
        actions.push(
          <Button key="exec" size="sm" onClick={() => openExecModal(item)}>
            Dados da execução
          </Button>
        );
      }
      actions.push(baseEditAction);
    } else {
      if (stepId === 6) {
        actions.push(
          <Button key="fiscal" size="sm" onClick={() => openFiscalModal(item)}>
            Registrar aprovação fiscal
          </Button>
        );
      }
      if (stepId === 7) {
        actions.push(
          <Button key="tci" size="sm" onClick={() => openTciModal(item)}>
            Registrar TCI
          </Button>
        );
      }
      if (stepId === 8) {
        actions.push(
          <Button key="auditoria" size="sm" onClick={() => openAprovacaoModal(item)}>
            Registrar aprovação da medição
          </Button>
        );
      }
      if (stepId === 9) {
        actions.push(
          <Button key="lote" size="sm" variant="secondary" onClick={() => handleOpenEtapa9Modal(item)}>
            Registrar lote
          </Button>
        );
      }
      if (stepId === 10) {
        actions.push(
          <Button key="nf" size="sm" variant="ghost" onClick={() => handleOpenEtapa10Modal(item)}>
            Registrar NF
          </Button>
        );
      }
      if (stepId === 3) {
        actions.push(
          <Button key="medicao" size="sm" variant="outline" onClick={() => openMedicaoModal(item)}>
            Medição / Orçamento
          </Button>
        );
      }
      if (stepId === 4) {
        actions.push(
          <Button key="os" size="sm" onClick={() => openOsModal(item)}>
            Registrar OS
          </Button>
        );
      }
      if (stepId === 5) {
        actions.push(
          <Button key="book" size="sm" onClick={() => handleStage5BookClick(item)}>
            Criar book
          </Button>
        );
        actions.push(
          <Button
            key="obra"
            size="sm"
            variant="secondary"
            disabled={!bookRegistrado}
            onClick={() => openNumeroObraModal(item)}
            title={bookRegistrado ? undefined : "Registre o book e a data de envio antes"}
          >
            Inserir numero da obra
          </Button>
        );
      }
    }

    if (actions.length === 0) return null;

    return <div className="flex flex-wrap gap-2">{actions}</div>;
  };



  const fetchRetornoItems = async (
    idAcionamento: string,
    modalidade: "LM" | "LV"
  ): Promise<RetornoItemRecord[]> => {
    const { data, error } = await supabase
      .from("medicao_retorno_items")
      .select(
        "id,origem,modalidade,codigo,descricao,quantidade,ups,total_valor,regra_aplicada"
      )
      .eq("id_acionamento", idAcionamento)
      .eq("modalidade", modalidade)
      .in("origem", ["ENVIADO", "APROVADO"])
      .order("codigo");
    if (error) throw error;
    let items = (data || []).map((row: any) => ({
      ...row,
      total_valor: Number(row.total_valor) || 0,
      quantidade: Number(row.quantidade) || 0,
      ups: Number(row.ups) || 0,
    }));
    const hasEnviado = items.some((row) => row.origem === "ENVIADO");
    if (!hasEnviado) {
      const enviadoRows = await fetchEnviadoRetornoRows(idAcionamento, modalidade);
      const fallback = enviadoRows.map((row) => ({
        origem: "ENVIADO" as const,
        modalidade,
        codigo: row.codigo,
        descricao: row.descricao,
        quantidade: Number(row.quantidade) || 0,
        ups: Number(row.ups) || 0,
        total_valor: Number(row.total_valor) || 0,
        regra_aplicada: row.regra_aplicada || null,
      }));
      items = [...fallback, ...items];
    }
    return items;
  };

  const buildAuditComparison = (
    items: RetornoItemRecord[],
    baseDate: string | undefined
  ): AuditComparison => {
    const grouped = new Map<
      string,
      {
        codigo: string;
        descricao?: string;
        regra?: string;
        enviado?: RetornoItemRecord;
        aprovado?: RetornoItemRecord;
      }
    >();

    items.forEach((item) => {
      const key = item.codigo || `${item.id}`;
      const entry = grouped.get(key) || { codigo: item.codigo };
      entry.descricao = entry.descricao || item.descricao;
      if (item.origem === "ENVIADO") {
        entry.enviado = item;
      } else {
        entry.aprovado = item;
      }
      if (item.regra_aplicada && !entry.regra) {
        entry.regra = item.regra_aplicada;
      }
      grouped.set(key, entry);
    });

    const rows: AuditComparisonRow[] = [];
    grouped.forEach((entry) => {
      const totalEnviado = entry.enviado?.total_valor ?? 0;
      const totalAprovado = entry.aprovado?.total_valor ?? 0;
      const difference = totalAprovado - totalEnviado;
      const differencePercent = totalEnviado
        ? (difference / totalEnviado) * 100
        : totalAprovado
        ? 100
        : 0;
      const valorRetido = totalAprovado < totalEnviado ? totalEnviado - totalAprovado : 0;
      const status = deriveAuditStatus(totalEnviado, totalAprovado, entry.regra);
      rows.push({
        codigo: entry.codigo,
        descricao: entry.descricao || entry.enviado?.descricao || entry.aprovado?.descricao || "-",
        quantidadeEnviada: entry.enviado?.quantidade || 0,
        upsEnviado: entry.enviado?.ups || 0,
        totalEnviado,
        quantidadeAprovada: entry.aprovado?.quantidade || 0,
        upsAprovado: entry.aprovado?.ups || 0,
        totalAprovado,
        difference,
        differencePercent,
        valorRetido,
        regraAplicada: entry.regra,
        status,
        alertAuditoria: differencePercent < -5 || valorRetido > 20,
      });
    });

    const mappedRows = rows.sort((a, b) => b.valorRetido - a.valorRetido);
    const totalEnviado = mappedRows.reduce((sum, row) => sum + row.totalEnviado, 0);
    const totalAprovado = mappedRows.reduce((sum, row) => sum + row.totalAprovado, 0);
    const diferenca = totalAprovado - totalEnviado;
    const diferencaPercent = totalEnviado ? (diferenca / totalEnviado) * 100 : 0;
    const itensComDivergencia = mappedRows.filter(
      (row) => Math.abs(row.difference) > 0.01 || Math.abs(row.quantidadeEnviada - row.quantidadeAprovada) > 0.01
    ).length;
    const valorRetido = mappedRows.reduce((sum, row) => sum + row.valorRetido, 0);

    const ruleImpactMap = new Map<string, { itens: number; impacto: number }>();
    mappedRows.forEach((row) => {
      const regra = row.regraAplicada || "Regra geral";
      const existing = ruleImpactMap.get(regra) || { itens: 0, impacto: 0 };
      existing.itens += 1;
      existing.impacto += row.difference;
      ruleImpactMap.set(regra, existing);
    });

    const ruleImpact: RuleImpact[] = Array.from(ruleImpactMap.entries()).map(([regra, data]) => ({
      regra,
      itens: data.itens,
      impacto: data.impacto,
    }));

    const statusBreakdown: Record<AuditItemStatus, number> = {
      integral: 0,
      parcial: 0,
      glosado: 0,
      ajuste: 0,
      excluido: 0,
    };
    mappedRows.forEach((row) => {
      statusBreakdown[row.status] = (statusBreakdown[row.status] || 0) + 1;
    });

    const timeline = buildTimelineSeries(baseDate, valorRetido);

    return {
      summary: {
        totalEnviado,
        totalAprovado,
        diferenca,
        diferencaPercent,
        itensComDivergencia,
        valorRetido,
      },
      rows: mappedRows,
      ruleImpact,
      timeline,
      statusBreakdown,
    };
  };

  const handleReajusteValor = async (modalidade: "LM" | "LV") => {
    const idAcionamento = selectedItem?.id_acionamento || selectedItem?.id;
    if (!idAcionamento) {
      setAuditoriaError("Selecione um acionamento para abrir a auditoria.");
      setAuditoriaModalOpen(true);
      return;
    }
    setAuditoriaLoading(true);
    setAuditoriaError(null);
    setAuditoriaData(null);
    setAuditoriaModalOpen(true);
    try {
      const rows = await fetchRetornoItems(idAcionamento, modalidade);
      if (rows.length === 0) {
        setAuditoriaError("Ainda não existem registros de retorno da concessionária para essa medição.");
        return;
      }
      const comparison = buildAuditComparison(rows, selectedItem?.medicao_aprovada_em || null);
      setAuditoriaData(comparison);
    } catch (err: any) {
      if (
        typeof err?.message === "string" &&
        err.message.toLowerCase().includes("medicao_retorno_items")
      ) {
        setAuditoriaError(
          "Ainda não existe a tabela de retorno da concessionária no banco de dados. Peça ao time de dados para criar `medicao_retorno_items`."
        );
      } else {
        setAuditoriaError(
          err?.message ||
            "Não foi possível carregar os dados de auditoria. Verifique se a etapa de retorno da concessionária foi preenchida."
        );
      }
    } finally {
      setAuditoriaLoading(false);
    }
  };

  const fetchEnviadoRetornoRows = async (idAcionamento: string, modalidade: "LM" | "LV") => {
    const { data: enviados, error } = await supabase
      .from("medicao_retorno_items")
      .select("codigo,descricao,quantidade,ups,total_valor,regra_aplicada")
      .eq("id_acionamento", idAcionamento)
      .eq("modalidade", modalidade)
      .eq("origem", "ENVIADO");
    if (error) throw error;
    if (enviados && enviados.length > 0) {
      return enviados.map((row: any) => ({
        codigo: row.codigo,
        descricao: row.descricao,
        quantidade: Number(row.quantidade) || 0,
        ups: Number(row.ups) || 0,
        total_valor: Number(row.total_valor) || 0,
        regra_aplicada: row.regra_aplicada,
      }));
    }
    const { data: context, error: medError } = await supabase
      .from("medicao_orcamentos")
      .select(modalidade === "LM" ? "itens_lm" : "itens_lv")
      .eq("id_acionamento", idAcionamento)
      .maybeSingle();
    if (medError) throw medError;
    const key = modalidade === "LM" ? "itens_lm" : "itens_lv";
    const sourceItems = parseMedicaoItens(context?.[key]);
    return sourceItems;
  };

  const loadRetornoModalidadeData = async (modalidade: "LM" | "LV", itemParam?: any) => {
    const itemToUse = itemParam ?? selectedItem;
    if (!itemToUse) return;
    setRetornoModalidade(modalidade);
    setRetornoLoading(true);
    setRetornoError(null);
    setRetornoRows([]);
    setRetornoEnviadoRows([]);
    try {
      const previewContext = aprovacaoContextoPreview[modalidade];
      const previewResumo = aprovacaoResumoPreview[modalidade];
      const records = await fetchRetornoItems(
        itemToUse.id_acionamento || itemToUse.id,
        modalidade
      );
      const hasApproved = records.some((record) => record.origem === "APROVADO");
      if (hasApproved) {
        setRetornoContexto(previewContext ?? null);
        setRetornoResumo(previewResumo ?? null);
        const rows = buildRowsFromRetornoRecords(records);
        setRetornoEnviadoRows(
          rows.map((row) => ({
            ...row,
            quantidadeAprovada: row.quantidadeEnviada,
            upsAprovado: row.upsEnviado,
            totalAprovado: row.totalEnviado,
          }))
        );
        setRetornoRows(rows);
        return;
      }
      if (previewContext && previewResumo) {
        setRetornoContexto(previewContext);
        setRetornoResumo(previewResumo);
        const baseRows = buildRowsFromResumo(previewResumo);
        setRetornoEnviadoRows(baseRows);
        setRetornoRows(baseRows.map((row) => ({ ...row })));
        return;
      }
      let contexto: OrcamentoPdfContext | null = null;
      let resumo: MaoDeObraResumo | null = null;
      try {
        contexto = await prepararOrcamentoContext(
          itemToUse.id_acionamento || itemToUse.id,
          modalidade,
          itemToUse
        );
        if (contexto) {
          resumo = calcularResumoMaoDeObra(contexto);
        }
      } catch (err) {
        contexto = null;
      }
      if (contexto && resumo) {
        setRetornoContexto(contexto);
        setRetornoResumo(resumo);
        const baseRows = buildRowsFromResumo(resumo);
        setRetornoEnviadoRows(baseRows);
        setRetornoRows(baseRows.map((row) => ({ ...row })));
      } else {
        setRetornoContexto(null);
        setRetornoResumo(null);
        const baseRecords = records.filter((record) => record.origem === "ENVIADO");
        if (baseRecords.length > 0) {
          const baseRows = baseRecords.map((record) => toRetornoRowFromRecord(record));
          setRetornoEnviadoRows(baseRows);
          setRetornoRows(baseRows.map((row) => ({ ...row })));
        } else {
          const rows = await fetchEnviadoRetornoRows(
            itemToUse.id_acionamento || itemToUse.id,
            modalidade
          );
          const baseRows = rows.map((row) => toRetornoRowFromRecord(row));
          setRetornoEnviadoRows(baseRows);
          setRetornoRows(baseRows.map((row) => ({ ...row })));
        }
      }
    } catch (err: any) {
      setRetornoError(err?.message || "Não foi possível carregar os itens enviados.");
    } finally {
      setRetornoLoading(false);
    }
  };

  const handleRetornoModalidadeChange = (modalidade: "LM" | "LV") => {
    if (!selectedItem) return;
    if (modalidade === retornoModalidade && retornoRows.length > 0) {
      setRetornoModalidade(modalidade);
      return;
    }
    loadRetornoModalidadeData(modalidade);
  };

  const handleRetornoFieldChange = (
    codigo: string,
    field: "quantidadeAprovada" | "upsAprovado",
    value: string
  ) => {
    const numeric = Number(value.replace(",", "."));
    setRetornoRows((prev) =>
      prev.map((row) => {
        if (row.codigo !== codigo) return row;
        let updated = { ...row, [field]: Number.isFinite(numeric) ? numeric : row[field] };
        if (field === "quantidadeAprovada") {
          const price =
            row.unitPrice ||
            (row.quantidadeEnviada ? row.totalEnviado / row.quantidadeEnviada : 0);
          updated.totalAprovado = (Number.isFinite(numeric) ? numeric : row.quantidadeAprovada) * price;
        }
        return updated;
      })
    );
  };

  const handleOpenRetornoModal = async (item: any) => {
    setSelectedItem(item);
    setRetornoModalOpen(true);
    setRetornoLoading(true);
    setRetornoError(null);
    setRetornoRows([]);
    const loteId = generateLoteRetornoId();
    setRetornoLoteId(loteId);
    try {
      const modalidadeInicial = item.modalidade === "LV" ? "LV" : "LM";
      await loadRetornoModalidadeData(modalidadeInicial, item);
    } catch (err: any) {
      setRetornoError(err?.message || "Não foi possível carregar os itens enviados.");
    } finally {
      setRetornoLoading(false);
    }
  };

  const closeRetornoModal = () => {
    setRetornoModalOpen(false);
    setRetornoContexto(null);
    setRetornoResumo(null);
    setRetornoRows([]);
    setRetornoEnviadoRows([]);
    setRetornoSaveMessage(null);
  };

  const [retornoSaveMessage, setRetornoSaveMessage] = useState<string | null>(null);

  const salvarRetornoConcessionaria = async () => {
    if (!selectedItem) {
      setRetornoError("Selecione um acionamento antes de salvar o retorno.");
      return;
    }
    const idAcionamento = selectedItem.id_acionamento || selectedItem.id;
    if (!idAcionamento) {
      setRetornoError("ID do acionamento inválido.");
      return;
    }
    if (retornoRows.length === 0) {
      setRetornoError("Não há itens para salvar.");
      return;
    }
    setRetornoSaving(true);
    setRetornoError(null);
    try {
      const payload = retornoRows.map((row) => ({
        id_acionamento: idAcionamento,
        origem: "APROVADO",
        modalidade: retornoModalidade,
        codigo: row.codigo,
        descricao: row.descricao || null,
        quantidade: row.quantidadeAprovada,
        ups: row.upsAprovado,
        total_valor: row.totalAprovado,
        regra_aplicada: row.regraAplicada || null,
        lote_retorno_id: retornoLoteId,
      }));
      const { error } = await supabase.from("medicao_retorno_items").insert(payload);
      if (error) throw error;
      await loadRetornoModalidadeData(retornoModalidade);
      setRetornoSaveMessage("Retorno salvo com sucesso.");
    } catch (err: any) {
      setRetornoError(err?.message || "Erro ao salvar o retorno da concessionária.");
    } finally {
      setRetornoSaving(false);
    }
  };

  const retornoBaseTotal = retornoResumo?.totalBase ?? retornoEnviadoRows.reduce(
    (sum, row) => sum + (row.totalEnviado || 0),
    0
  );
  const retornoTotalAprovado = retornoRows.reduce(
    (sum, row) => sum + (row.totalAprovado || 0),
    0
  );
  const adicionalPercentual =
    retornoResumo && retornoResumo.totalBase
      ? (retornoResumo.totalComAdicional - retornoResumo.totalBase) / retornoResumo.totalBase
      : retornoContexto
      ? retornoContexto.medicaoForaHC
        ? 0.3
        : 0.12
      : 0;
  const retornoTotalComAdicional =
    retornoResumo?.totalComAdicional ?? retornoTotalAprovado * (1 + adicionalPercentual);
  const retornoDiferenca = retornoTotalAprovado - retornoBaseTotal;
  const retornoDiferencaPercent = retornoBaseTotal
    ? (retornoDiferenca / retornoBaseTotal) * 100
    : 0;
  const retornoValorRetido = Math.max(0, retornoBaseTotal - retornoTotalAprovado);
  const retornoTotalQtdeAprovada = retornoRows.reduce(
    (sum, row) => sum + (row.quantidadeAprovada || 0),
    0
  );
  const retornoAdditionalValue = retornoTotalComAdicional - retornoBaseTotal;
  const retornoAdditionalPercent =
    retornoBaseTotal && retornoBaseTotal > 0 ? (retornoAdditionalValue / retornoBaseTotal) * 100 : 0;
  const retornoAdditionalLabel = retornoContexto
    ? retornoContexto.medicaoForaHC
      ? "30% (SERV. EMERG.)"
      : "12% (HORÁRIO COMERCIAL)"
    : retornoResumo
    ? `${(adicionalPercentual * 100).toFixed(0)}% (${retornoResumo.acrescimoInfo?.descricao || "Adicional"})`
    : `${Math.round(adicionalPercentual * 100)}%`;
  const retornoSummaryCards = [
    {
      label: "Total base (R$)",
      value: formatCurrency(retornoBaseTotal),
      helper: "Somatório dos itens sem adicional",
    },
    {
      label: "Total aprovado (R$)",
      value: formatCurrency(retornoTotalAprovado),
      helper: "Somatório homologado",
    },
    {
      label: "Diferença total",
      value: formatCurrency(retornoDiferenca),
      helper: `${formatPercent(retornoDiferencaPercent)} sobre o base`,
    },
    {
      label: "Valor retido (R$)",
      value: formatCurrency(retornoValorRetido),
      helper: "Base − aprovado",
    },
  ];
  const renderAprovacaoPreviewContent = (modalidade: "LM" | "LV") => {
    const contexto = aprovacaoContextoPreview[modalidade];
    const resumo = aprovacaoResumoPreview[modalidade];
    if (!contexto || !resumo) {
      return (
        <div className="rounded-xl border border-muted/60 bg-muted/10 p-4 text-sm text-muted-foreground">
          Nenhum dado disponível para o módulo de {modalidade === "LM" ? "Linha Morta" : "Linha Viva"}.
        </div>
      );
    }
    const itensPreview = resumo.itensCalculados.slice(0, 3);
    const modalidadeLabel = modalidade === "LM" ? "Linha Morta" : "Linha Viva";
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-muted/80 bg-muted/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total da aba</p>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              {modalidadeLabel}
            </span>
          </div>
          <p className="text-2xl font-semibold">{formatCurrency(resumo.totalComAdicional)}</p>
          <p className="text-xs text-muted-foreground">
            Base {formatCurrency(resumo.totalBase)} + {contexto.medicaoForaHC ? "30%" : "12%"} (
            {resumo.acrescimoInfo.descricao})
          </p>
        </div>
        <div className="rounded-xl border border-muted/80 bg-muted/10 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Últimos itens</p>
          {itensPreview.length > 0 ? (
            itensPreview.map((item) => (
              <div
                key={item.index}
                className="flex items-center justify-between text-sm text-muted-foreground"
              >
                <span className="truncate pr-2">
                  {item.index}. {item.descricao || item.codigo}
                </span>
                <span className="font-semibold text-foreground">{formatCurrency(item.subtotal)}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">Sem itens listados.</p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-muted/80 bg-muted/10 p-2 text-[11px]">
            <p className="font-semibold truncate">{contexto.codigoAcionamento || "--"}</p>
            <p className="text-[11px] text-muted-foreground">
              {contexto.numeroIntervencaoTexto || "--"}
            </p>
          </div>
          <div className="rounded-xl border border-muted/80 bg-muted/10 p-2 text-[11px]">
            <p className="font-semibold">{contexto.dataExecucaoTexto || "--"}</p>
            <p className="text-[11px] text-muted-foreground">Data de execução</p>
          </div>
          <div className="rounded-xl border border-muted/80 bg-muted/10 p-2 text-[11px]">
            <p className="font-semibold truncate">{contexto.equipeTexto || "--"}</p>
            <p className="text-[11px] text-muted-foreground">Equipe</p>
          </div>
          <div className="rounded-xl border border-muted/80 bg-muted/10 p-2 text-[11px]">
            <p className="font-semibold truncate">{contexto.enderecoTexto || "--"}</p>
            <p className="text-[11px] text-muted-foreground">Endereço</p>
          </div>
          <div className="rounded-xl border border-muted/80 bg-muted/10 p-2 text-[11px] sm:col-span-2">
            <p className="font-semibold truncate">{contexto.alimentadorSubTexto || "--"}</p>
            <p className="text-[11px] text-muted-foreground">Alimentador / Subestação</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <WorkflowModalContext.Provider value={modalContextValue}>

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

                        type="button"

                        onClick={() => handleStepClick(step)}

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

        <div className="px-6">
          <Input
            placeholder="Buscar acionamento, município ou código"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="mb-3"
          />
        </div>

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

              <div><Label>OS tablet (opcional)</Label><Input value={execForm.os_tablet} disabled={execReadonly} onChange={(e) => handleExecChange('os_tablet', e.target.value)} /></div>

              <div><Label>SS (Nota) (opcional)</Label><Input value={execForm.ss_nota} disabled={execReadonly} onChange={(e) => handleExecChange('ss_nota', e.target.value)} /></div>

              <div><Label>Nº da intervenção</Label><Input value={execForm.numero_intervencao} disabled={execReadonly} onChange={(e) => handleExecChange('numero_intervencao', e.target.value)} /></div>

            </div>



            <div>

              <Label>Observaçães gerais</Label>

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

      <Dialog
        open={osModalOpen}
        onOpenChange={(next) => {
          if (!next) {
            closeOsModal();
          } else {
            setOsModalOpen(true);
          }
        }}
        modal
      >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Registrar dados da OS</DialogTitle>
            <DialogDescription>
              Informe o número da OS criada no sistema e confirme a data para liberar a próxima etapa.
            </DialogDescription>
          </DialogHeader>

          {osError && <div className="text-sm text-destructive">{osError}</div>}
          {osInfo && <div className="text-sm text-emerald-600">{osInfo}</div>}

          {osLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da OS...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Acionamento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">{osAcionamentoCodigo}</div>
                </div>
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Elemento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">{osElementoDisplay || "--"}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Número da OS</Label>
                  <Input
                    value={osForm.numero_os}
                    disabled={osSaving}
                    onChange={(e) => handleOsFormChange("numero_os", e.target.value)}
                    placeholder="Ex: 12345/2024"
                  />
                </div>
                <div>
                  <Label>Data/hora da criação</Label>
                  <Input
                    type="datetime-local"
                    value={osForm.os_criada_em}
                    disabled={osSaving}
                    onChange={(e) => handleOsFormChange("os_criada_em", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Observaçães</Label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm min-h-[90px]"
                  value={osForm.observacoes}
                  disabled={osSaving}
                  onChange={(e) => handleOsFormChange("observacoes", e.target.value)}
                  placeholder="Detalhes adicionais, vínculos ou procedimentos realizados."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeOsModal} disabled={osSaving}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              onClick={salvarDadosOs}
              disabled={osSaving || osLoading}
            >
              {osSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar OS
            </Button>
          </DialogFooter>
      </DialogContent>
      </Dialog>

      <Dialog
        open={fiscalModalOpen}
        onOpenChange={(next) => {
          if (!next) {
            closeFiscalModal();
          } else {
            setFiscalModalOpen(true);
          }
        }}
        modal
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Registrar aprovação fiscal</DialogTitle>
            <DialogDescription>
              Informe quando o fiscal assinou a aprovação para mover a obra na etapa.
            </DialogDescription>
          </DialogHeader>

          {fiscalError && <div className="text-sm text-destructive">{fiscalError}</div>}
          {fiscalInfo && <div className="text-sm text-emerald-600">{fiscalInfo}</div>}

          {fiscalLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da aprovação fiscal...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Acionamento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.codigo_acionamento || "--"}
                  </div>
                </div>
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Status atual</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.status || "--"}
                  </div>
                </div>
              </div>

              <div>
                <Label>Data/hora da assinatura fiscal</Label>
                <Input
                  type="datetime-local"
                  value={fiscalForm.assinatura_fiscal_em}
                  disabled={fiscalSaving}
                  onChange={(e) => handleFiscalFormChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeFiscalModal} disabled={fiscalSaving}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              onClick={salvarDadosFiscal}
              disabled={fiscalSaving || fiscalLoading}
            >
              {fiscalSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={auditoriaModalOpen}
        onOpenChange={(next) => {
          if (!next) {
            setAuditoriaModalOpen(false);
          }
        }}
        modal
      >
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Auditoria operacional e financeira</DialogTitle>
          <DialogDescription>
              Compare automaticamente a medição enviada pela contratada com o retorno da concessionária.
            </DialogDescription>
          </DialogHeader>

          {auditoriaError && (
            <div className="text-sm text-destructive mb-2">{auditoriaError}</div>
          )}
          {auditoriaLoading || !auditoriaData ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              {auditoriaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {auditoriaLoading ? "Processando auditoria..." : "Nenhum dado para comparar ainda."}
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[72vh] pr-2 pb-4">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    label: "Total Enviado (R$)",
                    value: formatCurrency(auditoriaData.summary.totalEnviado),
                    helper: "Soma dos valores transmitidos",
                  },
                  {
                    label: "Total Aprovado (R$)",
                    value: formatCurrency(auditoriaData.summary.totalAprovado),
                    helper: "Soma dos valores homologados",
                  },
                  {
                    label: "Diferença Absoluta (R$)",
                    value: formatCurrency(auditoriaData.summary.diferenca),
                    helper: `Partida aprovada – enviada (${formatPercent(auditoriaData.summary.diferencaPercent)})`,
                  },
                ].map((card) => (
                  <Card key={card.label} className="border">
                    <CardHeader className="space-y-1">
                      <CardTitle className="text-sm">{card.label}</CardTitle>
                      <CardDescription className="text-xs">{card.helper}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Itens com divergência
                </span>
                {auditoriaData.summary.valorRetido > 20 && (
                  <Badge className="text-[10px] uppercase text-destructive border-destructive/60">
                    ⚠ Auditoria Necessária
                  </Badge>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                  <p className="text-[11px] uppercase text-muted-foreground">Itens com divergência</p>
                  <p className="text-3xl font-semibold">{auditoriaData.summary.itensComDivergencia}</p>
                </div>
                <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                  <p className="text-[11px] uppercase text-muted-foreground">Valor retido (R$)</p>
                  <p className="text-3xl font-semibold">
                    {formatCurrency(auditoriaData.summary.valorRetido)}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Tabela de confronto por item
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Percentual de diferença &lt; -5% serão destacados
                  </span>
                </div>
                <div className="rounded-xl border border-muted/60 bg-muted/10 overflow-auto">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtde Enviada</TableHead>
                        <TableHead>UPS Enviado</TableHead>
                        <TableHead>Total Enviado R$</TableHead>
                        <TableHead>Qtde Aprovada</TableHead>
                        <TableHead>UPS Aprovado</TableHead>
                        <TableHead>Total Aprovado R$</TableHead>
                        <TableHead className="text-right">Diferença R$</TableHead>
                        <TableHead className="text-right">Diferença %</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditoriaData.rows.map((row) => (
                        <TableRow
                          key={`${row.codigo}-${row.status}`}
                          className={row.alertAuditoria ? "text-destructive" : ""}
                        >
                          <TableCell>{row.codigo}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{row.descricao}</TableCell>
                          <TableCell>{row.quantidadeEnviada.toFixed(2)}</TableCell>
                          <TableCell>{row.upsEnviado.toFixed(2)}</TableCell>
                          <TableCell>{formatCurrency(row.totalEnviado)}</TableCell>
                          <TableCell>{row.quantidadeAprovada.toFixed(2)}</TableCell>
                          <TableCell>{row.upsAprovado.toFixed(2)}</TableCell>
                          <TableCell>{formatCurrency(row.totalAprovado)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.difference)}</TableCell>
                          <TableCell className="text-right">{formatPercent(row.differencePercent)}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] px-2 py-0.5 rounded-full", AUDIT_STATUS_CLASSES[row.status])}>
                              {AUDIT_STATUS_LABELS[row.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Regras comerciais aplicadas
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {auditoriaData.ruleImpact.map((rule) => (
                    <Card key={rule.regra} className="border">
                      <CardHeader className="space-y-1">
                        <CardTitle className="text-sm">{rule.regra}</CardTitle>
                        <CardDescription className="text-[11px] text-muted-foreground">
                          Total de itens: {rule.itens}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-lg font-semibold">
                        {formatCurrency(rule.impacto)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground mb-3">
                      <span>Enviado vs Aprovado</span>
                    </div>
                    <div className="space-y-3">
                      {auditoriaData.rows.slice(0, 4).map((row) => {
                        const maxVal = Math.max(row.totalEnviado, row.totalAprovado, 1);
                        return (
                          <div key={row.codigo}>
                            <div className="flex justify-between text-[11px] text-muted-foreground">
                              <span>{row.codigo}</span>
                              <span>{formatCurrency(row.totalAprovado || 0)}</span>
                            </div>
                            <div className="relative overflow-hidden rounded-full bg-slate-200 h-4">
                              <div
                                className="absolute inset-y-0 left-0 bg-emerald-500"
                                style={{ width: `${(row.totalAprovado / maxVal) * 100}%` }}
                              />
                              <div
                                className="absolute inset-y-0 left-0 bg-blue-500"
                                style={{
                                  width: `${(row.totalEnviado / maxVal) * 100}%`,
                                  opacity: 0.7,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground mb-3">
                      <span>Status por item</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {Object.keys(auditoriaData.statusBreakdown).map((status) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-3 h-3 rounded-full",
                                AUDIT_STATUS_CLASSES[status as AuditItemStatus]
                              )}
                            />
                            {AUDIT_STATUS_LABELS[status as AuditItemStatus]}
                          </span>
                          <span>{auditoriaData.statusBreakdown[status as AuditItemStatus]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-xs uppercase text-muted-foreground mb-3">
                      <span>Evolução de perdas</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                      {auditoriaData.timeline.map((point) => {
                        const max = Math.max(...auditoriaData.timeline.map((p) => p.value), 1);
                        return (
                          <div key={point.label} className="flex-1">
                            <div
                              className="bg-destructive h-full rounded-t-md"
                              style={{ height: `${(point.value / max) * 100}%` }}
                            />
                            <p className="text-[11px] text-center mt-1">{point.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end">
          <Button variant="outline" onClick={() => setAuditoriaModalOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      open={retornoModalOpen}
      onOpenChange={(next) => {
        if (!next) {
          closeRetornoModal();
        }
      }}
      modal
    >
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Registro de retorno da concessionária</DialogTitle>
          <DialogDescription>
            Edite as quantidades/UPS/valores aprovados antes de salvar o lote.
          </DialogDescription>
        </DialogHeader>

        {retornoError && <div className="text-sm text-destructive">{retornoError}</div>}

        {retornoLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens enviados...
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pb-4">
            <Tabs
              value={retornoModalidade}
              onValueChange={(value) => handleRetornoModalidadeChange(value as "LM" | "LV")}
              className="space-y-3"
            >
              <TabsList className="grid grid-cols-2 gap-2 rounded-full bg-muted/20 p-1">
                {RETORNO_MODALIDADES.map((modalidade) => (
                <TabsTrigger
                  key={modalidade}
                  value={modalidade}
                  className="text-xs font-medium rounded-full px-3 py-1.5 border border-transparent transition-colors data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-md"
                >
                    {formatModalidadeLabel(modalidade)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="grid gap-4 xl:grid-cols-[1.05fr,1.45fr]">
              <div className="space-y-4">
                {renderRetornoReferenciaPanel(retornoContexto, retornoResumo)}
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-muted/100 bg-muted/10 p-2 shadow-sm overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtde Enviado</TableHead>
                        <TableHead>Total Enviado R$</TableHead>
                        <TableHead>Qtde Aprovado</TableHead>
                        <TableHead>Total Aprovado R$</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retornoRows.map((row) => (
                        <TableRow key={row.codigo}>
                          <TableCell>{row.codigo}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{row.descricao}</TableCell>
                          <TableCell>{row.quantidadeEnviada.toFixed(2)}</TableCell>
                          <TableCell>{formatCurrency(row.totalEnviado)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              size="sm"
                              value={row.quantidadeAprovada}
                              onChange={(e) =>
                                handleRetornoFieldChange(row.codigo, "quantidadeAprovada", e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(row.totalAprovado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {retornoSaveMessage && (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                    {retornoSaveMessage}
                  </div>
                )}
                <div className="rounded-xl border border-muted/100 bg-muted/10 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                    <span>Resumo do retorno</span>
                    <span className="text-[10px] text-foreground tracking-[0.3em]">Atualização automática</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {retornoSummaryCards.map((card) => (
                      <div
                        key={card.label}
                        className="flex-1 min-w-[150px] rounded-lg border border-muted/100 bg-white/80 p-3 shadow-sm"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {card.label}
                        </p>
                        <div className="text-lg font-semibold text-foreground">{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.helper}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={closeRetornoModal} disabled={retornoSaving}>
            Fechar
          </Button>
          <Button
            variant="secondary"
            onClick={salvarRetornoConcessionaria}
            disabled={retornoSaving || retornoLoading || retornoRows.length === 0}
          >
            {retornoSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar retorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <Dialog
        open={tciModalOpen}
        onOpenChange={(next) => {
          if (!next) {
            closeTciModal();
          } else {
            setTciModalOpen(true);
          }
        }}
        modal
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Registrar TCI</DialogTitle>
            <DialogDescription>
              Informe o número e a data do TCI para registrar que o documento foi emitido.
            </DialogDescription>
          </DialogHeader>

          {tciError && <div className="text-sm text-destructive">{tciError}</div>}
          {tciInfo && <div className="text-sm text-emerald-600">{tciInfo}</div>}

          {tciLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados do TCI...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Acionamento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.codigo_acionamento || "--"}
                  </div>
                </div>
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Status atual</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.status || "--"}
                  </div>
                </div>
              </div>

              <div>
                <Label>Data/hora do TCI</Label>
                <Input
                  type="datetime-local"
                  value={tciForm.tci_criado_em}
                  disabled={tciSaving}
                  onChange={(e) => handleTciFormChange(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeTciModal} disabled={tciSaving}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              onClick={salvarDadosTci}
              disabled={tciSaving || tciLoading}
            >
              {tciSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar TCI
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={aprovacaoModalOpen}
          onOpenChange={(next) => {
            if (!next) {
              closeAprovacaoModal();
            } else {
              setAprovacaoModalOpen(true);
            }
          }}
          modal
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Registrar aprovação da medição</DialogTitle>
              <DialogDescription>
                Informe a data e hora em que a medição foi aprovada para liberação da próxima etapa.
              </DialogDescription>
            </DialogHeader>

            {aprovacaoError && <div className="text-sm text-destructive">{aprovacaoError}</div>}
            {aprovacaoInfo && <div className="text-sm text-emerald-600">{aprovacaoInfo}</div>}

            {aprovacaoLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da aprovação...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Histórico de negociações</span>
                  {aprovacaoLogs[0] ? (
                    <span className="text-xs text-muted-foreground">
                      Última atualização em {formatDateTimeBr(aprovacaoLogs[0].criado_em)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhum registro</span>
                  )}
                </div>
                <div className="space-y-2 rounded-md border border-muted/60 bg-muted/10 p-2 max-h-60 overflow-y-auto">
                  {aprovacaoLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum registro de status da aprovação até o momento.
                    </p>
                  ) : (
                    aprovacaoLogs.map((log) => (
                      <div
                        key={log.id_log}
                        className="space-y-1 rounded-md border border-muted/40 bg-background px-3 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full",
                              APROVACAO_STATUS_CLASSES[log.status]
                            )}
                          >
                            {APROVACAO_STATUS_LABELS[log.status]}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTimeBr(log.criado_em)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {log.observacao || "Sem observação"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full rounded-md border border-input px-3 py-2 text-sm"
                      value={aprovacaoLogForm.status}
                      onChange={(e) =>
                        handleAprovacaoLogFieldChange("status", e.target.value as AprovacaoStatus)
                      }
                    >
                      <option value="aguardando">Aguardando</option>
                      <option value="reprovado">Reprovado</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                  <div>
                    <Label>Data/hora do registro</Label>
                    <Input
                      type="datetime-local"
                      value={aprovacaoLogForm.data}
                      disabled={aprovacaoSaving}
                      onChange={(e) => handleAprovacaoLogFieldChange("data", e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label>Observação</Label>
                    <textarea
                      className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[100px]"
                      value={aprovacaoLogForm.observacao}
                      disabled={aprovacaoSaving}
                      onChange={(e) =>
                        handleAprovacaoLogFieldChange("observacao", e.target.value)
                      }
                      placeholder="Descreva o andamento da negociação ou justificativa."
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  if (selectedItem) {
                    handleOpenRetornoModal(selectedItem);
                  }
                }}
                disabled={!selectedItem || retornoLoading}
              >
                Registro de retorno
              </Button>
              <Button variant="outline" onClick={closeAprovacaoModal} disabled={aprovacaoSaving}>
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={registrarStatusAprovacao}
                disabled={aprovacaoSaving || aprovacaoLogForm.status === "concluido"}
                title={
                  aprovacaoLogForm.status === "concluido"
                    ? "Use o botão de conclusão para finalizar"
                    : undefined
                }
              >
                {aprovacaoSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Registrar status
              </Button>
              <Button
                variant="secondary"
                onClick={salvarDadosAprovacao}
                disabled={
                  aprovacaoSaving ||
                  aprovacaoLogForm.status !== "concluido" ||
                  aprovacaoLoading
                }
              >
                {aprovacaoSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Concluir medição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={etapa9ModalOpen}
          onOpenChange={(next) => {
            if (!next) {
              closeEtapa9Modal();
            } else {
              setEtapa9ModalOpen(true);
            }
          }}
          modal
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Registro da etapa 9</DialogTitle>
              <DialogDescription>
                Informe o número do lote, o ciclo e confirme o pagamento acordado.
              </DialogDescription>
            </DialogHeader>

            {etapa9Error && <div className="text-sm text-destructive">{etapa9Error}</div>}

            {etapa9Loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da etapa...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-md border px-3 py-2 bg-muted/50">
                    <Label>Número do lote</Label>
                    <Input
                      type="text"
                      value={etapa9NumeroLote}
                      onChange={(e) => setEtapa9NumeroLote(e.target.value)}
                    />
                  </div>
                  <div className="rounded-md border px-3 py-2 bg-muted/50">
                    <Label>Ciclo</Label>
                    <Input
                      type="text"
                      value={etapa9Ciclo}
                      onChange={(e) => setEtapa9Ciclo(e.target.value)}
                    />
                  </div>
                  <div className="rounded-md border px-3 py-2 bg-muted/50">
                    <Label>Data de emissão do Lote</Label>
                    <Input
                      type="date"
                      value={etapa9DataEmissao}
                      onChange={(e) => setEtapa9DataEmissao(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-muted/60 bg-muted/10 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Valor final acordado
                  </p>
                  <div className="text-3xl font-semibold">
                    {etapa9ValorFinal !== null ? formatCurrency(etapa9ValorFinal) : "R$ 0,00"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Valor homologado na etapa anterior.
                  </p>
                </div>

                <div>
                  <Label>Observação</Label>
                  <textarea
                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[100px]"
                    value={etapa9Observacao}
                    onChange={(e) => setEtapa9Observacao(e.target.value)}
                    placeholder="Registre detalhes importantes para o fechamento."
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={etapa9Confirmado}
                    onChange={(e) => setEtapa9Confirmado(e.target.checked)}
                  />
                  Confirmar pagamento acordado
                </label>
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeEtapa9Modal} disabled={etapa9Saving}>
                Fechar
              </Button>
              <Button
                variant="secondary"
                onClick={salvarEtapa9}
                disabled={etapa9Saving || etapa9Loading || !etapa9Confirmado}
              >
                {etapa9Saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Confirmar etapa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={etapa10ModalOpen}
          onOpenChange={(next) => {
            if (!next) {
              closeEtapa10Modal();
            } else {
              setEtapa10ModalOpen(true);
            }
          }}
          modal
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Registro da etapa 10</DialogTitle>
              <DialogDescription>
                Confirme os dados do lote fiscal antes de emitir a nota.
              </DialogDescription>
            </DialogHeader>

            {etapa10Error && <div className="text-sm text-destructive">{etapa10Error}</div>}

            {etapa10Loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da etapa...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-md border px-3 py-2 bg-muted/50">
                    <Label>Numero da NF</Label>
                    <Input
                      type="text"
                      value={etapa10NumeroNF}
                      onChange={(e) => setEtapa10NumeroNF(e.target.value)}
                    />
                  </div>
                  <div className="rounded-md border px-3 py-2 bg-muted/50">
                    <Label>Data de emissão da NF</Label>
                    <Input
                      type="date"
                      value={etapa10DataEmissao}
                      onChange={(e) => setEtapa10DataEmissao(e.target.value)}
                    />
                  </div>
                  <div />
                </div>
                <div>
                  <Label>Observação</Label>
                  <textarea
                    className="w-full rounded-md border border-input px-3 py-2 text-sm min-h-[100px]"
                    value={etapa10Observacao}
                    onChange={(e) => setEtapa10Observacao(e.target.value)}
                    placeholder="Registre detalhes adicionais da emissão."
                  />
                </div>
                </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeEtapa10Modal} disabled={etapa10Saving}>
                Fechar
              </Button>
              <Button
                variant="secondary"
                onClick={salvarEtapa10}
                disabled={etapa10Saving || etapa10Loading}
              >
                {etapa10Saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Confirmar etapa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={bookModalOpen}
          onOpenChange={(next) => {
            if (!next) {
            closeBookModal();
          } else {
            setBookModalOpen(true);
          }
        }}
        modal
      >
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Registro do book</DialogTitle>
          <DialogDescription>
              Informe quando o book foi enviado á Energisa e deixe registrado o conteúdo do e-mail ou observações relevantes.
            </DialogDescription>
          </DialogHeader>

          {bookError && <div className="text-sm text-destructive">{bookError}</div>}
          {bookInfo && <div className="text-sm text-emerald-600">{bookInfo}</div>}

          <Tabs
            value={bookTab}
            onValueChange={(value) => setBookTab(value as typeof bookTab)}
            className="space-y-4"
          >
            <TabsList
              className={cn(
                "grid w-full gap-2",
                hasBookTrafoInfo ? "grid-cols-3" : "grid-cols-2"
              )}
            >
              <TabsTrigger value="book">Registro</TabsTrigger>
              <TabsTrigger value="ditais">DITAIS</TabsTrigger>
              {hasBookTrafoInfo && <TabsTrigger value="trafo">Trafo</TabsTrigger>}
            </TabsList>

            <TabsContent value="book">
              {bookLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados do book...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md border px-3 py-2 bg-muted/50">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Acionamento
                      </Label>
                      <div className="text-sm font-semibold text-foreground mt-1">
                        {selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--"}
                      </div>
                    </div>
                    <div className="rounded-md border px-3 py-2 bg-muted/50">
                      <Label className="text-xs font-semibold text-muted-foreground">Elemento</Label>
                      <div className="text-sm font-semibold text-foreground mt-1">
                        {selectedItem?.elemento_id || "--"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Anexar e-mail (.msg)</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        ref={bookAttachmentInputRef}
                        type="file"
                        accept=".msg"
                        className="sr-only"
                        disabled={!bookEmailStorageEnabled}
                        onChange={(e) => {
                          if (!bookEmailStorageEnabled) return;
                          const file = e.target.files?.[0];
                          handleBookEmailAttachmentUpload(file);
                          if (e.target) e.target.value = "";
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={triggerBookEmailAttachmentUpload}
                        disabled={bookSaving || !bookEmailStorageEnabled}
                      >
                        Selecionar arquivo
                      </Button>
                      {bookForm.email_attachment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={clearBookEmailAttachment}
                          disabled={bookSaving}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    {bookForm.email_attachment && (
                      <p className="text-xs text-muted-foreground">
                        {bookForm.email_attachment.name}
                      </p>
                    )}
                    {!bookEmailStorageEnabled && (
                      <p className="text-xs text-destructive">
                        As colunas `book_email_msg`/`book_email_msg_name` não existem na base; o anexo .msg não será salvo.
                      </p>
                    )}
                  </div>

                  {selectedItem?.book_enviado_em && (
                    <div className="text-xs text-muted-foreground">
                      Último registro em {formatDateTimeBr(selectedItem.book_enviado_em)}
                    </div>
                  )}

                  <div>
                    <Label>Data/hora do envio</Label>
                    <Input
                      type="datetime-local"
                      value={bookForm.book_enviado_em}
                      disabled={bookSaving}
                      onChange={(e) => handleBookFormChange("book_enviado_em", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Mensagem enviada</Label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[140px]"
                      value={bookForm.email_msg}
                      disabled={bookSaving}
                      onChange={(e) => handleBookFormChange("email_msg", e.target.value)}
                      placeholder="Cole aqui o texto do e-mail enviado ou observações importantes."
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ditais">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pb-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {ditaisFields.map((item) => (
                    <div key={item.field}>
                      <Label>{item.label}</Label>
                      <Input
                        type={item.field === "data_execucao" ? "datetime-local" : "text"}
                        value={bookDitais[item.field] || ""}
                        onChange={(e) => handleBookDitaisFieldChange(item.field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: "D", label: "D - desligar" },
                    { key: "I", label: "I - interromper" },
                    { key: "T", label: "T - testar" },
                    { key: "A", label: "A - aterrar" },
                    { key: "I2", label: "I - isolar" },
                    { key: "S", label: "S - sinalizar" },
                  ].map((item) => {
                    const photoKey = item.key as BookDitaisPhotoKey;
                    const photoValue = bookDitais.fotos[photoKey];
                    return (
                      <div key={item.key} className="rounded-xl border bg-card/80 p-3 space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                        <div className="border border-dashed border-muted-foreground/40 rounded-md h-40 overflow-hidden bg-muted/20 flex items-center justify-center">
                          {photoValue ? (
                            <img src={photoValue} alt={item.label} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem foto</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            id={`ditais-photo-${item.key}`}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            ref={(el) => {
                              photoInputRefs.current[photoKey] = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              handleBookDitaisPhotoChange(photoKey, file);
                              if (e.target) e.target.value = "";
                            }}
                          />
                          <div className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                triggerPhotoUpload(photoKey);
                              }}
                            >
                              Enviar foto
                            </Button>
                          </div>
                          {photoValue && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => handleBookDitaisRemovePhoto(photoKey)}
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Modelo da foto</Label>
                    <div className="rounded-xl border bg-card/80 p-3 space-y-2">
                      <div className="border border-dashed border-muted-foreground/40 rounded-md h-40 overflow-hidden bg-muted/20 flex items-center justify-center">
                        {bookDitais.foto_modelo ? (
                          <img src={bookDitais.foto_modelo} alt="Modelo" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem foto</span>
                        )}
                      </div>
                        <div className="flex gap-2">
                          <input
                            id="ditais-photo-model"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            ref={(el) => {
                              modeloInputRef.current = el;
                            }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => handleBookDitaisFieldChange("foto_modelo", reader.result as string);
                              reader.readAsDataURL(file);
                              if (e.target) e.target.value = "";
                            }}
                          />
                          <div className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                triggerModeloUpload();
                              }}
                            >
                              Enviar modelo
                            </Button>
                          </div>
                        {bookDitais.foto_modelo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => handleBookDitaisFieldChange("foto_modelo", "")}
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm min-h-[200px]"
                      value={bookDitais.observacao}
                      onChange={(e) => handleBookDitaisFieldChange("observacao", e.target.value)}
                      placeholder="Registre aqui a descrição das fotos, apontamentos do campo ou informações adicionais."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveBookDitais}
                      disabled={savingBookDitais}
                      type="button"
                    >
                      {savingBookDitais ? "Salvando..." : "Salvar DITAIS"}
                    </Button>
                  </div>
                  <Button onClick={handleExportBookDitais}>Exportar DITAIS</Button>
                </div>
              </div>
            </TabsContent>

            {hasBookTrafoInfo && (
              <TabsContent value="trafo">
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pb-4">
                  {bookTrafoData ? (
                    <div className="space-y-6">
                      {typeof bookTrafoData.troca_transformador === "boolean" && (
                        <div className="rounded-md border px-3 py-2 bg-muted/40 flex items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Troca de transformador
                          </span>
                          <span className="ml-auto text-sm font-semibold text-foreground">
                            {bookTrafoData.troca_transformador ? "Sim" : "Não"}
                          </span>
                        </div>
                      )}
                      {[
                        {
                          label: "Marca",
                          retirado: bookTrafoData.trafo_ret_marca,
                          instalado: bookTrafoData.trafo_inst_marca,
                        },
                        {
                          label: "Potência",
                          retirado: bookTrafoData.trafo_ret_potencia,
                          instalado: bookTrafoData.trafo_inst_potencia,
                        },
                        {
                          label: "Nº de série",
                          retirado: bookTrafoData.trafo_ret_numero_serie,
                          instalado: bookTrafoData.trafo_inst_numero_serie,
                        },
                        {
                          label: "Tensão primária",
                          retirado: bookTrafoData.trafo_ret_tensao_primaria,
                          instalado: bookTrafoData.trafo_inst_tensao_primaria,
                        },
                        {
                          label: "Tensão secundária",
                          retirado: bookTrafoData.trafo_ret_tensao_secundaria,
                          instalado: bookTrafoData.trafo_inst_tensao_secundaria,
                        },
                        {
                          label: "Fabricado",
                          retirado: bookTrafoData.trafo_ret_ano,
                          instalado: bookTrafoData.trafo_inst_ano,
                        },
                        {
                          label: "Patrimônio",
                          retirado: bookTrafoData.trafo_ret_patrimonio,
                          instalado: bookTrafoData.trafo_inst_patrimonio,
                        },
                      ].map((row) => {
                        const formatValue = (value: any) =>
                          value === null ||
                          value === undefined ||
                          (typeof value === "string" && value.trim().length === 0)
                            ? "--"
                            : value;
                        return (
                          <div key={row.label} className="grid grid-cols-[1fr_1fr_1fr] gap-3">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                              {row.label}
                            </div>
                            <div className="rounded-md border px-3 py-2 text-sm text-foreground bg-muted/40">
                              {formatValue(row.retirado)}
                            </div>
                            <div className="rounded-md border px-3 py-2 text-sm text-foreground bg-muted/40">
                              {formatValue(row.instalado)}
                            </div>
                          </div>
                        );
                      })}

                      <div className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-sm font-semibold">Fotos do trafo</div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={handleSaveBookTrafo}
                              disabled={savingBookTrafo}
                              type="button"
                            >
                              {savingBookTrafo ? "Salvando..." : "Salvar trafo"}
                            </Button>
                            <Button onClick={handleExportBookTrafo}>Exportar trafo</Button>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {installedTrafoSlots.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">
                                Transformador instalado
                              </div>
                              <div className="space-y-4">{renderSlotRows(installedTrafoSlots)}</div>
                            </div>
                          )}
                          {removedTrafoSlots.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">
                                Transformador retirado
                              </div>
                              <div className="space-y-4">{renderSlotRows(removedTrafoSlots)}</div>
                            </div>
                          )}
                          {generalTrafoSlots.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">Outras fotos</div>
                              <div className="space-y-4">{renderSlotRows(generalTrafoSlots)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Sem dados de transformador cadastrados.
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeBookModal} disabled={bookSaving}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              onClick={salvarDadosBook}
              disabled={bookSaving || bookLoading}
            >
              {bookSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Registrar book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={numeroModalOpen}
        onOpenChange={(next) => {
          if (!next) {
            closeNumeroObraModal();
          } else {
            setNumeroModalOpen(true);
          }
        }}
        modal
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inserir número da obra</DialogTitle>
            <DialogDescription>
              Informe o número da obra e confirme a data/hora em que a concessionária disponibilizou a informação.
            </DialogDescription>
          </DialogHeader>

          {numeroError && <div className="text-sm text-destructive">{numeroError}</div>}
          {numeroInfo && <div className="text-sm text-emerald-600">{numeroInfo}</div>}

          {numeroLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando dados da obra...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Acionamento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--"}
                  </div>
                </div>
                <div className="rounded-md border px-3 py-2 bg-muted/50">
                  <Label className="text-xs font-semibold text-muted-foreground">Elemento</Label>
                  <div className="text-sm font-semibold text-foreground mt-1">
                    {selectedItem?.elemento_id || "--"}
                  </div>
                </div>
              </div>

              {selectedItem?.numero_obra_atualizado_em && (
                <div className="text-xs text-muted-foreground">
                  Última atualização registrada em {formatDateTimeBr(selectedItem.numero_obra_atualizado_em)}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Número da obra</Label>
                  <Input
                    value={numeroForm.numero_obra}
                    disabled={numeroSaving}
                    onChange={(e) => handleNumeroObraFormChange("numero_obra", e.target.value)}
                    placeholder="Ex: OB-123456/2024"
                  />
                </div>
                <div>
                  <Label>Data/hora da confirmação</Label>
                  <Input
                    type="datetime-local"
                    value={numeroForm.numero_obra_atualizado_em}
                    disabled={numeroSaving}
                    onChange={(e) =>
                      handleNumeroObraFormChange("numero_obra_atualizado_em", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={closeNumeroObraModal} disabled={numeroSaving}>
              Fechar
            </Button>
            <Button
              variant="secondary"
              onClick={salvarNumeroObra}
              disabled={numeroSaving || numeroLoading}
            >
              {numeroSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar número
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={medicaoModalOpen} onOpenChange={setMedicaoModalOpen} modal>
        <DialogContent className="w-[98vw] max-w-7xl h-[92vh] flex flex-col p-0 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-4 pb-2 border-b">
              <DialogHeader className="text-center space-y-1">
                <DialogTitle className="text-xl font-bold">Medição / Orçamento</DialogTitle>
                <DialogDescription>Monte o orçamento de mão de obra. Os itens ficam salvos como rascunho e podem ser exportados em PDF.</DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between mt-3">
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


              {(modalSuportaLM || modalSuportaLV) && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modalSuportaLM && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-semibold">Equipe Linha Morta</Label>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        disabled={medicaoEquipeOpcoes.LM.length === 0}
                        value={medicaoEquipeSelecionada.LM}
                        onChange={(e) => atualizarEquipeSelecionada("LM", e.target.value)}
                      >
                        <option value="">{medicaoEquipeOpcoes.LM.length === 0 ? "Nenhuma equipe disponível" : "Selecione"}</option>
                        {medicaoEquipeOpcoes.LM.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className={`text-xs font-semibold ${
                          medicaoEquipeOpcoes.LM.length === 0
                            ? "text-red-600"
                            : equipeValidaParaLinha("LM")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {medicaoEquipeOpcoes.LM.length === 0
                          ? "Nenhuma equipe de Linha Morta vinculada ao acionamento"
                          : equipeValidaParaLinha("LM")
                          ? "Equipe validada para Linha Morta"
                          : "Selecione uma equipe LM válida"}
                      </span>
                    </div>
                  )}
                  {modalSuportaLV && (
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-semibold">Equipe Linha Viva</Label>
                      <select
                        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                        disabled={medicaoEquipeOpcoes.LV.length === 0}
                        value={medicaoEquipeSelecionada.LV}
                        onChange={(e) => atualizarEquipeSelecionada("LV", e.target.value)}
                      >
                        <option value="">{medicaoEquipeOpcoes.LV.length === 0 ? "Nenhuma equipe disponível" : "Selecione"}</option>
                        {medicaoEquipeOpcoes.LV.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className={`text-xs font-semibold ${
                          medicaoEquipeOpcoes.LV.length === 0
                            ? "text-red-600"
                            : equipeValidaParaLinha("LV")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {medicaoEquipeOpcoes.LV.length === 0
                          ? "Nenhuma equipe de Linha Viva vinculada ao acionamento"
                          : equipeValidaParaLinha("LV")
                          ? "Equipe validada para Linha Viva"
                          : "Selecione uma equipe LV válida"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-2 gap-3 px-6 py-3">
              {/* Quadrante 1: Catálogo */}
              <div className="rounded-md border p-3 space-y-2 flex flex-col min-h-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm flex-1">Catálogo de MO</h4>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{medicaoCatalogo.filter(m => {
                    const buscaMatch = (m.codigo_mao_de_obra || "").toLowerCase().includes(medicaoBusca.toLowerCase()) || (m.descricao || "").toLowerCase().includes(medicaoBusca.toLowerCase());
                    const tipoMatch = (m.tipo || "").toUpperCase() === medicaoTab;
                    const naoEhAjusteHC = !["26376", "92525"].includes(m.codigo_mao_de_obra);
                    return buscaMatch && tipoMatch && naoEhAjusteHC;
                  }).length}</div>
                </div>
                <Input placeholder="Buscar..." value={medicaoBusca} onChange={(e) => setMedicaoBusca(e.target.value)} className="text-xs h-8" />
                <div className="flex-1 overflow-y-auto border rounded-md bg-card">
                  {medicaoCatalogo
                    .filter((m) => {
                      const buscaMatch = 
                        (m.codigo_mao_de_obra || "").toLowerCase().includes(medicaoBusca.toLowerCase()) ||
                        (m.descricao || "").toLowerCase().includes(medicaoBusca.toLowerCase());
                      const tipoMatch = (m.tipo || "").toUpperCase() === medicaoTab;
                      const naoEhAjusteHC = !["26376", "92525"].includes(m.codigo_mao_de_obra);
                      return buscaMatch && tipoMatch && naoEhAjusteHC;
                    })
                    .map((m) => {
                      const upsValor = Number(m.ups ?? m.valorUps ?? 0);
                      return (
                        <button
                          key={`${m.codigo_mao_de_obra}-${m.operacao}-${m.tipo}`}
                          className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted border-b transition-colors"
                          onClick={() => handleAddMedicaoItem(m)}
                        >
                          <div className="font-semibold truncate">{m.codigo_mao_de_obra}</div>
                          <div className="text-muted-foreground text-xs truncate">{m.descricao}</div>
                          <div className="text-[10px] text-muted-foreground flex justify-between gap-2">
                            <span className="uppercase">Op: {m.operacao || "-"}</span>
                            <span>UPS: {upsValor ? upsValor.toFixed(2) : "0"}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Quadrante 2: Itens MO */}
              <div className="rounded-md border p-3 space-y-2 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Itens {medicaoTab}</h4>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">R$ {totalAbaMedicao(medicaoTab).toFixed(2)}</span>
                </div>
                {(medicaoItens[medicaoTab] || []).length === 0 ? (
                  <div className="flex items-center justify-center flex-1 text-muted-foreground">
                    <p className="text-xs">Nenhum item</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto min-h-0 border rounded-sm bg-card">
                    <div className="text-xs divide-y">
                      {(medicaoItens[medicaoTab] || []).map((i) => (
                        <div key={`${i.codigo}-${i.operacao}`} className="p-2 hover:bg-muted transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{i.codigo}</div>
                              <div className="text-muted-foreground text-xs truncate">{i.descricao}</div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveMedicao(i.codigo, i.operacao)}
                              className="h-5 w-5 p-0 text-xs"
                            >
                              ò
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                            <input 
                              type="number" 
                              min={0} 
                              step="0.01" 
                              value={i.quantidade} 
                              onChange={(e) => handleQtdMedicao(i.codigo, i.operacao, Number(e.target.value))}
                              placeholder="Qty"
                              className="border rounded px-1 h-6 bg-background"
                            />
                            <div className="text-right">{i.unidade}</div>
                            <div className="text-right font-semibold">{subtotalMedicao(i).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quadrante 3: Materiais Aplicados */}
              <div className="rounded-md border p-3 space-y-2 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Materiais Aplicados</h4>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{consumo.length}</span>
                </div>
                {consumo.length === 0 ? (
                  <div className="flex items-center justify-center flex-1 text-muted-foreground">
                    <p className="text-xs">Nenhum material</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto min-h-0 border rounded-sm bg-card divide-y">
                    {consumo.map((m: any) => (
                      <div key={m.codigo_material} className="p-2 hover:bg-muted transition-colors text-xs">
                        <div className="font-semibold truncate">{m.codigo_material}</div>
                        <div className="text-muted-foreground text-xs truncate">{m.descricao_item}</div>
                        <div className="text-muted-foreground text-xs">Qtd: {m.quantidade}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quadrante 4: Materiais Retirados */}
              <div className="rounded-md border p-3 space-y-2 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Materiais Retirados</h4>
                  <span className="text-xs bg-muted px-2 py-1 rounded">{sucata.length}</span>
                </div>
                {sucata.length === 0 ? (
                  <div className="flex items-center justify-center flex-1 text-muted-foreground">
                    <p className="text-xs">Nenhum material</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto min-h-0 border rounded-sm bg-card divide-y">
                    {sucata.map((m: any) => (
                      <div key={m.codigo_material} className="p-2 hover:bg-muted transition-colors text-xs">
                        <div className="font-semibold truncate">{m.codigo_material}</div>
                        <div className="text-muted-foreground text-xs truncate">{m.descricao_item}</div>
                        <div className="text-muted-foreground text-xs">Qtd: {m.quantidade} | {m.classificacao}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-3 bg-muted/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
              <div className={`text-xs font-semibold ${
                (medicaoEquipeOpcoes[medicaoTab]?.length || 0) === 0
                  ? "text-red-600"
                  : equipeValidaParaLinha(medicaoTab)
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
                {(medicaoEquipeOpcoes[medicaoTab]?.length || 0) === 0
                  ? `Nenhuma equipe de ${medicaoTab === "LM" ? "Linha Morta" : "Linha Viva"} vinculada ao acionamento.`
                  : equipeValidaParaLinha(medicaoTab)
                  ? `Equipe validada para ${medicaoTab === "LM" ? "Linha Morta" : "Linha Viva"}.`
                  : `Selecione uma equipe de ${medicaoTab === "LM" ? "Linha Morta" : "Linha Viva"} para liberar o PDF.`}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => salvarMedicao()} disabled={savingMedicao} className="gap-2">
                  {savingMedicao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingMedicao ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  disabled={pdfGeracaoIndisponivel}
                  variant="outline"
                  onClick={gerarOrcamentoLayoutEng}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Layout EngElétrica
                </Button>
                <Button
                  disabled={pdfGeracaoIndisponivel}
                  variant="outline"
                  onClick={exportarOrcamentoExcel}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar Excel
                </Button>
                <Button
                  disabled={!podeConcluirEtapa3}
                  onClick={avancarParaEtapa4}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  title={
                    pendenciaPdf
                      ? `Gere o PDF de ${pendenciaPdfDescricao || "mão de obra"} para liberar a etapa.`
                      : etapa4Liberada
                      ? "Etapa já liberada."
                      : undefined
                  }
                >
                  {advancingEtapa4 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {etapa4Liberada ? "Etapa 4 liberada" : "Concluir Etapa 3"}
                </Button>
                </div>
                {pendenciaPdf ? (
                  <p className="text-xs text-amber-600 font-semibold text-right">
                    Gere o PDF de {pendenciaPdfDescricao || "mão de obra"} para liberar o avanço.
                  </p>
                ) : ultimoPdfGeradoEm ? (
                  <p className="text-[11px] text-muted-foreground text-right">
                    Último PDF gerado em {formatDateTimeBr(ultimoPdfGeradoEm)}
                  </p>
                ) : null}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={materialsOpen} onOpenChange={setMaterialsOpen} modal>

        <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] overflow-y-auto px-3 sm:px-6">

          <DialogHeader className="text-center space-y-1 items-center">

            <DialogTitle className="text-xl font-bold">

              {`Acionamento ${selectedItem?.codigo_acionamento || selectedItem?.id_acionamento || "--"} - ${selectedItem?.municipio || "--"} - ${getDataTitulo()}`}

            </DialogTitle>

            {selectedStep?.id !== 1 && selectedStep?.id !== 2 && (

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

                      const tooltip = precisaEscolher

                        ? "Selecione um encarregado para gerar o PDF"

                        : "Gere o PDF da pré-lista";

                      return (

                        <div className="flex flex-wrap gap-2 justify-end">

                          <Button

                            variant="outline"

                            onClick={exportPreListaPdf}

                            disabled={preLista.length === 0 || precisaEscolher}

                            title={tooltip}

                          >

                            <FileDown className="h-4 w-4 mr-2" />

                            Exportar PDF

                          </Button>

                        </div>

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

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar acionamento</DialogTitle>
            <DialogDescription>Atualize os dados principais deste acionamento.</DialogDescription>
          </DialogHeader>
          {editError && (
            <div className="text-sm text-destructive mb-2">{editError}</div>
          )}
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Modalidade</Label>
                <Select
                  value={editForm.modalidade}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, modalidade: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a modalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select
                  value={editForm.prioridade}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, prioridade: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Município</Label>
                <Input
                  placeholder="Município"
                  value={editForm.municipio}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, municipio: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Endereço</Label>
                <Input
                  placeholder="Endereço"
                  value={editForm.endereco}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, endereco: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Encarregado</Label>
                <Input
                  placeholder="Encarregado"
                  value={editForm.encarregado}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, encarregado: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Número da OS</Label>
                <Input
                  placeholder="Número da OS"
                  value={editForm.numero_os}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, numero_os: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Data de abertura</Label>
                <Input
                  type="date"
                  placeholder="Data de abertura"
                  value={editForm.data_abertura}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, data_abertura: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Data de despacho</Label>
                <Input
                  type="date"
                  placeholder="Data de despacho"
                  value={editForm.data_despacho}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, data_despacho: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Data de execução</Label>
                <Input
                  type="date"
                  placeholder="Data de execução"
                  value={editForm.data_execucao}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, data_execucao: event.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observação</Label>
              <Textarea
                value={editForm.observacao}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, observacao: event.target.value }))
                }
              />
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </Card>
    </WorkflowModalContext.Provider>

  );

};
export default WorkflowSteps;
