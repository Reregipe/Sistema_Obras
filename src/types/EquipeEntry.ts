// src/types/EquipeEntry.ts
import type { EquipeLinha } from "../data/equipesCatalog";

export interface EquipeEntry {
  codigo: string;
  nome: string;
  linha: EquipeLinha;
  encarregado?: string | null;
}
