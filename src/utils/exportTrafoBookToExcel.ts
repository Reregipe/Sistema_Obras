import trafoTemplateUrl from "@/assets/Book Fotográfico Empreiteiras - Trafos Queimados e Avariados - 9555.xlsx?url";

export const TRAFO_PHOTO_SLOTS = [
  { key: "estrutura_queimado", label: "Estrutura queimada", range: "B12:I12", imageRowCount: 1 },
  { key: "circuito_bt", label: "Circuito BT", range: "K12:R12", imageRowCount: 1 },
  { key: "trafo_retirado_frontal", label: "Trafo retirado (frontal)", range: "B14:I14", imageRowCount: 1 },
  { key: "trafo_retirado_traseira", label: "Trafo retirado (traseira)", range: "K14:R14", imageRowCount: 1 },
  { key: "trafo_retirado_lateral1", label: "Trafo retirado (lateral 1)", range: "B16:I16", imageRowCount: 1 },
  { key: "trafo_retirado_lateral2", label: "Trafo retirado (lateral 2)", range: "K16:R16", imageRowCount: 1 },
  { key: "trafo_retirado_superior", label: "Trafo retirado (superior)", range: "B18:I18", imageRowCount: 1 },
  { key: "placa_retirado", label: "Placa retirado", range: "K18:R18", imageRowCount: 1 },
  { key: "para_raios_retirado", label: "Pararraios retirado", range: "B20:I20", imageRowCount: 1 },
  { key: "aterramento_retirado", label: "Aterramento retirado", range: "K20:R20", imageRowCount: 1 },
  { key: "foto_adicional_1", label: "Foto adicional 1", range: "B22:I22", imageRowCount: 1 },
  { key: "foto_adicional_2", label: "Foto adicional 2", range: "K22:R22", imageRowCount: 1 },
  { key: "trafo_instalado", label: "Trafo instalado", range: "B25:I25", imageRowCount: 1 },
  { key: "placa_instalada", label: "Placa instalada", range: "K25:R25", imageRowCount: 1 },
  { key: "para_raios_instalado", label: "Pararraios instalado", range: "B27:I27", imageRowCount: 1 },
  { key: "aterramento_instalado", label: "Aterramento instalado", range: "K27:R27", imageRowCount: 1 },
  { key: "estrutura_nova", label: "Estrutura nova", range: "B29:I29", imageRowCount: 1 },
  { key: "medicoes_corrente", label: "Medições de corrente", range: "K29:R29", imageRowCount: 1 },
  { key: "medicoes_tensao", label: "Medições de tensão", range: "B31:I31", imageRowCount: 1 },
  { key: "medicao_aterramento", label: "Medição aterramento", range: "K31:R31", imageRowCount: 1 },
] as const;

export type TrafoPhotoKey = (typeof TRAFO_PHOTO_SLOTS)[number]["key"];

const PHOTO_IMAGE_SCALE = 0.7;
const POINT_TO_EMU = 9525;

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

  const fillIfPresent = (address: string, value?: string | number | null) => {
    if (value !== null && value !== undefined && value !== "") {
      setCellText(sheet, address, value);
    }
  };

  const filledData = payload.bookTrafoData ?? {};
  fillIfPresent("D37", filledData.tensao_an);
  fillIfPresent("D38", filledData.tensao_bn);
  fillIfPresent("D39", filledData.tensao_cn);
  fillIfPresent("G37", filledData.tensao_ab);
  fillIfPresent("G38", filledData.tensao_ca);
  fillIfPresent("G39", filledData.tensao_bc);

  const ensurePhotoRowHeight = (startRow: number, endRow: number, minHeight = 50) => {
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex += 1) {
      const row = sheet.getRow(rowIndex);
      if (!row.height || row.height < minHeight) {
        row.height = minHeight;
      }
    }
  };

  const addImageForRange = async (range: string, dataUrl?: string, imageRowCount = 4) => {
    if (!dataUrl) return;
    const borderedDataUrl = await drawImageWithBorder(dataUrl);
    const parsed = parseImageFromDataUrl(borderedDataUrl);
    if (!parsed) return;
    const rangeBounds = getRangeBounds(range);
    const imageStartRow = rangeBounds.startRow + 1;
    const imageEndRow = imageStartRow + Math.max(1, imageRowCount - 1);
    ensurePhotoRowHeight(imageStartRow, imageEndRow);
    const imageWidth = sumColumnWidths(sheet, rangeBounds.startCol, rangeBounds.endCol) * PHOTO_IMAGE_SCALE;
    const imageHeight = sumRowHeights(sheet, imageStartRow, imageEndRow) * PHOTO_IMAGE_SCALE;
    const imageId = workbook.addImage({ buffer: parsed.buffer, extension: parsed.extension });
    sheet.addImage(imageId, {
      tl: {
        col: rangeBounds.startCol - 1,
        row: imageStartRow - 1,
        offsetX: 10 * POINT_TO_EMU,
      },
      ext: { width: imageWidth, height: imageHeight },
      editAs: "oneCell",
    });
  };

  const photos = payload.photos ?? ({} as Record<TrafoPhotoKey, string>);
  for (const slot of TRAFO_PHOTO_SLOTS) {
    if (photos[slot.key]) {
      const rowCount = (slot as typeof TRAFO_PHOTO_SLOTS[number]).imageRowCount ?? 4;
      // eslint-disable-next-line no-await-in-loop
      await addImageForRange(slot.range, photos[slot.key], rowCount);
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
