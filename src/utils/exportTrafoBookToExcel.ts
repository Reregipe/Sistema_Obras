import trafoTemplateUrl from "@/assets/Book Fotográfico Empreiteiras - Trafos Queimados e Avariados - 9555.xlsx?url";

export const TRAFO_PHOTO_SLOTS = [
  { key: "estrutura_queimado", range: "B12:I12" },
  { key: "circuito_bt", range: "K12:R12" },
  { key: "trafo_retirado_frontal", range: "B14:I14" },
  { key: "trafo_retirado_traseira", range: "K14:R14" },
  { key: "trafo_retirado_lateral1", range: "B16:I16" },
  { key: "trafo_retirado_lateral2", range: "K16:R16" },
  { key: "trafo_retirado_superior", range: "B18:I18" },
  { key: "placa_retirado", range: "K18:R18" },
  { key: "para_raios_retirado", range: "B20:I20" },
  { key: "aterramento_retirado", range: "K20:R20" },
  { key: "foto_adicional_1", range: "B22:I22" },
  { key: "foto_adicional_2", range: "K22:R22" },
  { key: "trafo_instalado", range: "B25:I25" },
  { key: "placa_instalada", range: "K25:R25" },
  { key: "para_raios_instalado", range: "B27:I27" },
  { key: "aterramento_instalado", range: "K27:R27" },
  { key: "estrutura_nova", range: "B29:I29" },
  { key: "medicoes_corrente", range: "K29:R29" },
  { key: "medicoes_tensao", range: "B31:I31" },
  { key: "medicao_aterramento", range: "K31:R31" },
] as const;

export type TrafoPhotoKey = (typeof TRAFO_PHOTO_SLOTS)[number]["key"];

const PHOTO_IMAGE_SCALE = 0.92;

const CM_TO_PIXELS = 37.7952755906;

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const drawImageWithBorder = async (dataUrl: string) => {
  const img = await loadImageElement(dataUrl);
  const borderSize = 3;
  const canvas = document.createElement("canvas");
  canvas.width = img.width + borderSize * 2;
  canvas.height = img.height + borderSize * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, borderSize, borderSize);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = borderSize;
  ctx.strokeRect(borderSize / 2, borderSize / 2, img.width + borderSize, img.height + borderSize);
  return canvas.toDataURL("image/png");
};

const parseImageFromDataUrl = (dataUrl?: string) => {
  if (!dataUrl) return null;
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith("data:")) return null;
  const match = trimmed.match(/^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i);
  if (!match) return null;
  const [, mimeType, base64] = match;
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  const normalized = mimeType.toLowerCase();
  const extension = normalized.includes("png") ? "png" : normalized.includes("jpeg") || normalized.includes("jpg") ? "jpeg" : "png";
  return { buffer, extension } as const;
};

const formatDateForExcel = (value?: string) => {
  if (!value) return "";
  const parsedISO = new Date(value);
  if (!Number.isNaN(parsedISO.getTime())) {
    return parsedISO.toLocaleDateString("pt-BR");
  }
  const match = value.match(/(\d{2})[^\d](\d{2})[^\d](\d{4})/);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  return value;
};

const columnIndexFromLetter = (letter: string) => {
  let index = 0;
  for (let i = 0; i < letter.length; i += 1) {
    const ch = letter.charCodeAt(i);
    index = index * 26 + (ch - 64);
  }
  return index;
};

const getRangeBounds = (range: string) => {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Range inválido: ${range}`);
  }
  const [, startCol, startRow, endCol, endRow] = match;
  return {
    startCol: columnIndexFromLetter(startCol),
    endCol: columnIndexFromLetter(endCol),
    startRow: Number(startRow),
    endRow: Number(endRow),
  };
};

const rowHeightToPixels = (height?: number) => (height ? height * (96 / 72) : 18);

const columnWidthToPixels = (width?: number) => (width ? width * 7 + 5 : 64);

const sumColumnWidths = (sheet: any, startCol: number, endCol: number) => {
  let total = 0;
  for (let col = startCol; col <= endCol; col += 1) {
    total += columnWidthToPixels(sheet.getColumn(col).width);
  }
  return total;
};

const sumRowHeights = (sheet: any, startRow: number, endRow: number) => {
  let total = 0;
  for (let row = startRow; row <= endRow; row += 1) {
    total += rowHeightToPixels(sheet.getRow(row).height);
  }
  return total;
};

const setCellText = (sheet: any, address: string, text?: string | number | Date | null) => {
  const cell = sheet.getCell(address);
  cell.value = text ?? "";
};

export type BookTrafoExportPayload = {
  selectedItem?: any;
  bookTrafoData?: any;
  photos?: Record<TrafoPhotoKey, string>;
};

export async function exportTrafoBookToExcel(payload: BookTrafoExportPayload) {
  const ExcelJS = (await import("exceljs")).default;
  const response = await fetch(trafoTemplateUrl);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o modelo de trafo.");
  }

  const templateBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Planilha de trafo inválida.");
  }

  const codigoTrafo = payload.selectedItem?.codigo_acionamento || payload.selectedItem?.id_acionamento;
  setCellText(sheet, "E5", codigoTrafo);
  setCellText(sheet, "J5", formatDateForExcel(payload.selectedItem?.data_execucao || payload.selectedItem?.data_abertura));
  setCellText(sheet, "N5", payload.selectedItem?.numero_os || payload.bookTrafoData?.numero_os);
  setCellText(sheet, "E7", payload.bookTrafoData?.numero_intervencao || payload.selectedItem?.numero_intervencao);
  setCellText(sheet, "J7", payload.bookTrafoData?.alimentador || payload.selectedItem?.alimentador);
  setCellText(sheet, "N7", payload.bookTrafoData?.encarregado);
  setCellText(sheet, "E9", payload.bookTrafoData?.tipo_troca);

  const addImageForRange = async (range: string, dataUrl?: string) => {
    if (!dataUrl) return;
    const borderedDataUrl = await drawImageWithBorder(dataUrl);
    const parsed = parseImageFromDataUrl(borderedDataUrl);
    if (!parsed) return;
    const rangeBounds = getRangeBounds(range);
    const imageWidth = sumColumnWidths(sheet, rangeBounds.startCol, rangeBounds.endCol) * PHOTO_IMAGE_SCALE;
    const imageHeight = sumRowHeights(sheet, rangeBounds.startRow, rangeBounds.endRow) * PHOTO_IMAGE_SCALE;
    const imageId = workbook.addImage({ buffer: parsed.buffer, extension: parsed.extension });
    sheet.addImage(imageId, {
      tl: { col: rangeBounds.startCol - 1, row: rangeBounds.startRow - 1 },
      ext: { width: imageWidth, height: imageHeight },
      editAs: "oneCell",
    });
  };

  const photos = payload.photos ?? ({} as Record<TrafoPhotoKey, string>);
  for (const slot of TRAFO_PHOTO_SLOTS) {
    if (photos[slot.key]) {
      // eslint-disable-next-line no-await-in-loop
      await addImageForRange(slot.range, photos[slot.key]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nomeArquivo = `book_trafo_${codigoTrafo || "trafos"}_${Date.now()}.xlsx`;
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const trafoPhotoSlots = TRAFO_PHOTO_SLOTS;
