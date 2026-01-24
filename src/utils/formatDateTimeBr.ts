// src/utils/formatDateTimeBr.ts
export function formatDateTimeBr(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("pt-BR");
}
