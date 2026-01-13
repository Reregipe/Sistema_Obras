import { mockDossier } from "../data/mockDossier";
import DossierHeader from "../components/dossier/DossierHeader";
import DossierSection from "../components/dossier/DossierSection";
import { DataField } from "../components/dossier/DataField";
import FinancialSummaryLMLV from "../components/dossier/FinancialSummaryLMLV";
import { DataTable } from "../components/dossier/DataTable";
import BookInfo from "../components/dossier/BookInfo";
import StatusBadge from "../components/dossier/StatusBadge";
import EmptyState from "../components/dossier/EmptyState";
import {
  User,
  Truck,
  Ruler,
  Camera,
  FileCheck,
  Receipt,
  RotateCcw,
  Package,
  Recycle,
  Copy,
} from "lucide-react";

export default function AcionamentoDetalhe() {
  const { acionamento, equipes, execucao, medicaoOrcamento, medicaoRetornoItems, materiaisAplicados, sucataItens } =
    mockDossier;

  const prioridadeBadge = (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold gap-1">
      <span className="w-2 h-2 rounded-full bg-red-500 mr-1" />
      Alta
    </span>
  );
  const statusBadge = (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold gap-1">
      <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
      Em Medição
    </span>
  );
  const riscoBadge = (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold gap-1">
      <Copy className="w-4 h-4 mr-1" />
      Médio
    </span>
  );

  const valorPrevisto = (
    <span className="text-black font-bold">
      R${" "}
      {acionamento.valor_previsto?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}
    </span>
  );
  const valorAprovado = (
    <span className="text-green-600 font-bold flex items-center gap-1">
      <RotateCcw className="w-4 h-4" />
      R${" "}
      {acionamento.valor_aprovado?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}
    </span>
  );
  const valorRetido = (
    <span className="text-red-600 font-bold flex items-center gap-1">
      <RotateCcw className="w-4 h-4 rotate-180" />
      R${" "}
      {acionamento.valor_retido?.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}
    </span>
  );

  return (
    <div className="max-w-full mx-auto px-10 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-8 h-8 text-blue-500 bg-blue-100 rounded-full p-1" />
            <div>
              <div className="text-xs text-muted-foreground font-semibold uppercase">Acionamento</div>
              <div className="text-2xl font-bold">#{acionamento.codigo_acionamento}</div>
            </div>
          </div>
          <div className="hidden md:block h-10 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{acionamento.municipio}</span>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{acionamento.modalidade}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Prioridade:</span> {prioridadeBadge}
          <span className="text-sm text-muted-foreground">Status:</span> {statusBadge}
          <span className="text-sm text-muted-foreground">Risco:</span> {riscoBadge}
          <span className="text-sm text-muted-foreground ml-2">Previsto</span> {valorPrevisto}
          <span className="text-sm text-muted-foreground">Aprovado</span> {valorAprovado}
          <span className="text-sm text-muted-foreground">Retido</span> {valorRetido}
        </div>
      </div>

      {/* DEBUG CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusBadge title="fetchStatus" hint="OK" variant="success" />
        <StatusBadge title="Codigo" hint={acionamento.codigo_acionamento.toString()} variant="default" />
        <StatusBadge title="UUID" hint={acionamento.id_acionamento} variant="secondary" />
        <StatusBadge title="loaderStatus" hint="OK" variant="success" />
      </div>

      {/* Dados Gerais */}
      <DossierSection title="Dados Gerais" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField label="Código" value={acionamento.codigo} mono />
          <DataField label="Status" value={acionamento.status} />
          <DataField label="Modalidade" value={acionamento.modalidade} />
          <DataField label="Município" value={acionamento.municipio} />
          <DataField label="Endereço" value={acionamento.endereco} />
        </div>
      </DossierSection>

      {/* Execução */}
      <DossierSection title="Execução" icon={Truck}>
        {execucao ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataField label="KM Inicial" value={execucao.km_inicial?.toLocaleString() ?? "—"} mono />
            <DataField label="KM Final" value={execucao.km_final?.toLocaleString() ?? "—"} mono />
            <DataField
              label="KM Total"
              value={
                execucao.km_total !== null ? (
                  <span className="font-semibold text-primary">{execucao.km_total} km</span>
                ) : (
                  "—"
                )
              }
            />
            <DataField label="Saída Base" value={execucao.saida_base || "—"} mono />
            <DataField label="Início Serviço" value={execucao.inicio_servico || "—"} mono />
            <DataField label="Retorno Serviço" value={execucao.retorno_servico || "—"} mono />
            <DataField label="Retorno Base" value={execucao.retorno_base || "—"} mono />
            <DataField label="Alimentador" value={execucao.alimentador || "—"} mono />
            <DataField label="Subestação" value={execucao.subestacao || "—"} mono />
            <DataField label="Nº Transformador" value={execucao.numero_transformador || "—"} mono />
            <DataField label="Nº Poste" value={execucao.id_poste || "—"} mono />
          </div>
        ) : (
          <EmptyState message="Sem dados de execução" />
        )}
      </DossierSection>

      {/* Medição */}
      <DossierSection title="Medição" icon={Ruler}>
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Resumo Financeiro (Orçamentos)
            </h3>
            <FinancialSummaryLMLV orcamento={medicaoOrcamento} />
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <RotateCcw className="w-4 h-4" />
              Retorno da Concessionária
            </h3>
            {medicaoRetornoItems.length > 0 ? (
              <DataTable
                columns={[
                  { key: "codigo", header: "Código", mono: true },
                  { key: "descricao", header: "Descrição" },
                  { key: "quantidade", header: "Qtde", align: "center", mono: true },
                  {
                    key: "ups",
                    header: "UPS",
                    align: "right",
                    mono: true,
                    render: (v: number) => (v ? v.toFixed(2) : "—"),
                  },
                  {
                    key: "total_valor",
                    header: "Total Valor",
                    align: "right",
                    mono: true,
                    render: (v: number) =>
                      v
                        ? v.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—",
                  },
                  {
                    key: "regra_aplicada",
                    header: "Regra Aplicada",
                    render: (v: string) =>
                      v ? (
                        <span className="text-xs text-status-warning">{v}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      ),
                  },
                ]}
                data={medicaoRetornoItems}
              />
            ) : (
              <EmptyState message="Sem itens de retorno" />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Package className="w-4 h-4" />
              Materiais Aplicados
            </h3>
            {materiaisAplicados.length > 0 ? (
              <DataTable
                columns={[
                  { key: "codigo_material", header: "Código", mono: true },
                  { key: "descricao_item", header: "Descrição" },
                  { key: "unidade_medida", header: "Unidade", align: "center" },
                  { key: "quantidade", header: "Qtde", align: "center", mono: true },
                  {
                    key: "valor_unitario_upr",
                    header: "Valor Unit.",
                    align: "right",
                    mono: true,
                    render: (v: number) =>
                      v
                        ? v.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—",
                  },
                  {
                    key: "valor_total",
                    header: "Valor Total",
                    align: "right",
                    mono: true,
                    render: (v: number) =>
                      v
                        ? v.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—",
                  },
                ]}
                data={materiaisAplicados}
              />
            ) : (
              <EmptyState message="Sem materiais aplicados" />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Recycle className="w-4 h-4" />
              Sucata
            </h3>
            {sucataItens.length > 0 ? (
              <DataTable
                columns={[
                  { key: "codigo_material", header: "Código", mono: true },
                  { key: "quantidade_retirada", header: "Qtde Retirada", align: "center", mono: true },
                  {
                    key: "classificacao",
                    header: "Classificação",
                    align: "right",
                    render: (v: string) => (
                      <StatusBadge variant={v === "Aproveitável" ? "success" : "warning"}>
                        {v || "—"}
                      </StatusBadge>
                    ),
                  },
                ]}
                data={sucataItens}
              />
            ) : (
              <EmptyState message="Sem itens de sucata" />
            )}
          </div>
        </div>
      </DossierSection>

      <DossierSection title="Book" icon={Camera}>
        <BookInfo acionamento={acionamento} />
      </DossierSection>

      <DossierSection title="Fiscal / TCI" icon={FileCheck}>
        <div className="grid grid-cols-2 gap-4">
          <DataField label="TCI Número" value={acionamento.tci_numero || "—"} mono />
          <DataField label="Fiscal Enviado em" value={acionamento.fiscal_enviado_em || "—"} mono />
          <DataField label="Assinatura Fiscal" value={acionamento.assinatura_fiscal_em || "—"} mono />
          <DataField label="Assinatura Cliente" value={acionamento.assinatura_cliente_em || "—"} mono />
        </div>
      </DossierSection>

      <DossierSection title="Lote / Nota Fiscal" icon={Receipt}>
        <div className="grid grid-cols-2 gap-4">
          <DataField label="Lote Gerado em" value={acionamento.lote_gerado_em || "—"} mono />
          <DataField label="NF Número" value={acionamento.nf_numero || "—"} mono />
          <DataField label="NF Emitida em" value={acionamento.nf_emitida_em || "—"} mono />
        </div>
      </DossierSection>
    </div>
  );
}
