import * as XLSX from "xlsx";

/**
 * Gera o book DITAIS em formato Excel (.xlsx) com layout visual semelhante ao PDF homologado.
 * @param {object} bookData - Dados do book (campos do cabeçalho, fotos, observações)
 */
export function exportBookToExcel(bookData: any) {
  // Estrutura do cabeçalho e layout visual
  const sheetData: any[] = [];
  let row = 0;

  // Linha 1: Logo (texto) + Título + Data Execução
  sheetData.push([
    "LOGO ENERGISA", "", "", "FORMULÁRIO PARA FOTOS DOS DITAIS", "", "DATA EXECUÇÃO:", bookData.data_execucao || ""
  ]); row++;
  // Linha 2: campos da obra
  sheetData.push([
    "Nº DA OBRA:", bookData.numero_obra || "",
    "REGIONAL:", bookData.regional || "",
    "MUNICÍPIO:", bookData.municipio || "",
    "PRESTADORA:", bookData.prestadora || ""
  ]); row++;
  // Linha 3: responsável
  sheetData.push([
    "RESPONSÁVEL:", bookData.responsavel || ""
  ]); row++;
  // Linha 4: título DITAIS
  sheetData.push([
    "DITAIS - Desligar - Interromper - Testar - Aterrar - Isolar - Sinalizar"
  ]); row++;

  // Blocos DITAIS (títulos e caixas)
  const etapas = [
    { key: "D", label: "D - desligar" },
    { key: "I", label: "I - interromper" },
    { key: "T", label: "T - testar" },
    { key: "A", label: "A - aterrar" },
    { key: "I2", label: "I - isolar" },
    { key: "S", label: "S - sinalizar" },
  ];
  // Títulos dos blocos
  for (let i = 0; i < etapas.length; i += 2) {
    sheetData.push([etapas[i].label, "", etapas[i + 1].label, ""]); row++;
    // Caixas para fotos (células grandes e vazias)
    sheetData.push([
      bookData.fotos?.[etapas[i].key] || "",
      "",
      bookData.fotos?.[etapas[i + 1].key] || "",
      ""
    ]); row++;
  }

  // Bloco modelo da foto e observação
  sheetData.push(["MODELO DA FOTO", "", "Observação:", ""]); row++;
  sheetData.push([
    bookData.foto_modelo || "",
    "",
    bookData.observacao || "",
    ""
  ]); row++;
  // Linhas extras para observação (simulando linhas)
  for (let i = 0; i < 5; i++) {
    sheetData.push(["", "", "__________________________", ""]); row++;
  }

  // Criar worksheet e workbook
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  // Mesclagens para simular layout
  ws['!merges'] = [
    // Logo e título
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },
    // Data execução
    { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } },
    // Campos da obra
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
    { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } },
    // Responsável
    { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    // Título DITAIS
    { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
    // Blocos DITAIS (títulos)
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
    { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
    { s: { r: 8, c: 2 }, e: { r: 8, c: 3 } },
    // MODELO DA FOTO e Observação
    { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } },
    { s: { r: 10, c: 2 }, e: { r: 10, c: 3 } },
  ];
  ws["!cols"] = [
    { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }
  ];

  // Salvar arquivo
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Book");
  const nomeArquivo = `formulario_ditais_${bookData.numero_obra || "obra"}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
}
