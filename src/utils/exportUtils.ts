import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  user_id: string;
  role: string;
  acao: string;
  concedido_por: string | null;
  criado_em: string;
  user_nome: string;
  user_email: string;
  admin_nome: string | null;
}

const roleNames: Record<string, string> = {
  ADMIN: "Administrador",
  ADM: "Administrativo",
  GESTOR: "Gestor",
  OPER: "Operacional",
  FIN: "Financeiro",
};

export const exportToPDF = (history: HistoryEntry[]) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text("Relatório de Auditoria de Permissões", 14, 22);

  // Data de geração
  doc.setFontSize(11);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    30
  );

  // Preparar dados para tabela
  const tableData = history.map((entry) => [
    entry.user_nome,
    entry.user_email,
    roleNames[entry.role] || entry.role,
    entry.acao === "concedido" ? "Concedido" : "Removido",
    entry.admin_nome || "-",
    format(new Date(entry.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  ]);

  // Criar tabela
  autoTable(doc, {
    head: [["Usuário", "Email", "Permissão", "Ação", "Por", "Data"]],
    body: tableData,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [103, 126, 234] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Salvar PDF
  doc.save(`auditoria-permissoes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

export const exportToExcel = (history: HistoryEntry[]) => {
  // Preparar dados para Excel
  const excelData = history.map((entry) => ({
    Usuário: entry.user_nome,
    Email: entry.user_email,
    Permissão: roleNames[entry.role] || entry.role,
    Ação: entry.acao === "concedido" ? "Concedido" : "Removido",
    "Concedido/Removido Por": entry.admin_nome || "-",
    Data: format(new Date(entry.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  }));

  // Criar workbook e worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 25 }, // Usuário
    { wch: 30 }, // Email
    { wch: 20 }, // Permissão
    { wch: 12 }, // Ação
    { wch: 25 }, // Por
    { wch: 18 }, // Data
  ];
  ws["!cols"] = colWidths;

  // Salvar arquivo
  XLSX.writeFile(wb, `auditoria-permissoes-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};
