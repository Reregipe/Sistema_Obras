// src/types/BookForm.ts

export type BookFormField = "numero_obra" | "data_execucao" | "municipio" | "regional" | "prestadora" | "responsavel" | "observacao" | "foto_modelo";

export interface BookFormType {
  numero_obra: string;
  data_execucao: string;
  municipio: string;
  regional: string;
  prestadora: string;
  responsavel: string;
  observacao: string;
  foto_modelo: string;
  fotos: Record<"D" | "I" | "T" | "A" | "I2" | "S", string>;
}

export const emptyBookForm: BookFormType = {
  numero_obra: "",
  data_execucao: "",
  municipio: "",
  regional: "",
  prestadora: "",
  responsavel: "",
  observacao: "",
  foto_modelo: "",
  fotos: { D: "", I: "", T: "", A: "", I2: "", S: "" },
};
