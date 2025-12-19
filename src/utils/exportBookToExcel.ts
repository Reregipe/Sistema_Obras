import ditaisTemplateUrl from "@/assets/A - FOTOS DITAIS - MODELO.xlsx?url";
import engelLogoUrl from "@/assets/LOGO_ENERGISA.png?url";

const DITAIS_PHOTO_KEYS = ["D", "I", "T", "A", "I2", "S"] as const;
type BookDitaisPhotoKey = (typeof DITAIS_PHOTO_KEYS)[number];

export type BookDitaisExportPayload = {
  data_execucao?: string;
  numero_obra?: string;
  regional?: string;
  municipio?: string;
  prestadora?: string;
  responsavel?: string;
  foto_modelo?: string;
  observacao?: string;
  fotos?: Record<BookDitaisPhotoKey, string>;
};

const PHOTO_RANGES: Record<BookDitaisPhotoKey, string> = {
  D: "B10:E23",
  I: "F10:K23",
  T: "B25:E38",
  A: "F25:K38",
  I2: "B40:E53",
  S: "F40:K53",
};

const MODEL_RANGE = "B56:E71";
const OBSERVACAO_CELL = "G58";
const LOGO_WIDTH_CM = 4.18;
const LOGO_HEIGHT_CM = 1.37;
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
  const extension = normalized.includes("png")
    ? "png"
    : normalized.includes("jpeg") || normalized.includes("jpg")
      ? "jpeg"
      : "png";
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

const rowHeightToPixels = (height?: number) => {
  if (!height) return 18;
  return height * (96 / 72);
};

const columnWidthToPixels = (width?: number) => {
  if (!width) return 64;
  return width * 7 + 5;
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

const PHOTO_IMAGE_SCALE = 0.92;

const setCellText = (sheet: any, address: string, text?: string | number | Date | null) => {
  const cell = sheet.getCell(address);
  cell.value = text ?? "";
};

export async function exportBookToExcel(payload: BookDitaisExportPayload) {
  const ExcelJS = (await import("exceljs")).default;
  const response = await fetch(ditaisTemplateUrl);
  if (!response.ok) {
    throw new Error("Não foi possível carregar o modelo de Excel.");
  }

  const templateBuffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("Planilha de DITAIS inválida.");
  }

  setCellText(sheet, "J2", formatDateForExcel(payload.data_execucao?.trim() ?? ""));
  setCellText(sheet, "C4", payload.numero_obra?.trim() ?? "");
  setCellText(sheet, "H4", (payload.regional ?? "METROPOLITANA").trim());
  setCellText(sheet, "C5", payload.municipio?.trim() ?? "");
  setCellText(sheet, "H5", payload.prestadora?.trim() ?? "");
  setCellText(sheet, "C6", payload.responsavel?.trim() ?? "");

  const observacao = payload.observacao?.trim() ?? "";
  setCellText(sheet, OBSERVACAO_CELL, observacao);
  sheet.getCell(OBSERVACAO_CELL).alignment = {
    wrapText: true,
    vertical: "top",
    horizontal: "left",
  };

  const photos = payload.fotos ?? ({} as Record<BookDitaisPhotoKey, string>);
  const addImageForRange = async (range: string, dataUrl?: string) => {
    if (!dataUrl) return;
    const borderedDataUrl = await drawImageWithBorder(dataUrl);
    const parsed = parseImageFromDataUrl(borderedDataUrl);
    if (!parsed) return;
    const rangeBounds = getRangeBounds(range);
    const imageWidth = sumColumnWidths(sheet, rangeBounds.startCol, rangeBounds.endCol) * PHOTO_IMAGE_SCALE;
    const imageHeight = sumRowHeights(sheet, rangeBounds.startRow, rangeBounds.endRow) * PHOTO_IMAGE_SCALE;
    const rowHeightPt = sheet.getRow(rangeBounds.startRow).height || 15;
    const verticalOffsetRows = 10 / rowHeightPt;
    const imageId = workbook.addImage({ buffer: parsed.buffer, extension: parsed.extension });
    sheet.addImage(imageId, {
      tl: { col: rangeBounds.startCol - 1, row: rangeBounds.startRow - 1 + verticalOffsetRows },
      ext: { width: imageWidth, height: imageHeight },
      editAs: "oneCell",
    });
  };

  try {
    const logoResponse = await fetch(engelLogoUrl);
    if (logoResponse.ok) {
      const logoBuffer = await logoResponse.arrayBuffer();
      const logoId = workbook.addImage({ buffer: logoBuffer, extension: "png" });
      const logoWidth = LOGO_WIDTH_CM * CM_TO_PIXELS;
      const logoHeight = LOGO_HEIGHT_CM * CM_TO_PIXELS;
      sheet.addImage(logoId, {
        tl: { col: 1, row: 0 },
        ext: { width: logoWidth, height: logoHeight },
      });
    }
  } catch (err) {
    console.warn("Falha ao carregar logo para o Excel:", err);
  }

  for (const key of DITAIS_PHOTO_KEYS) {
    // eslint-disable-next-line no-await-in-loop
    await addImageForRange(PHOTO_RANGES[key], photos[key]);
  }
  // eslint-disable-next-line no-await-in-loop
  await addImageForRange(MODEL_RANGE, payload.foto_modelo);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = (payload.numero_obra ?? "obra").replace(/[^a-zA-Z0-9_-]/g, "_");
  link.href = url;
  link.download = `DITAIS_${safeName}_${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
