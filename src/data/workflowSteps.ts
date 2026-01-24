// src/data/workflowSteps.ts
import type { WorkflowStep } from "../types/WorkflowStep";

export const workflowSteps: WorkflowStep[] = [
  { id: 1, name: "Início", status: "pending", ordem: 1 },
  { id: 2, name: "Execução", status: "pending", ordem: 2 },
  { id: 3, name: "Finalização", status: "pending", ordem: 3 },
  // Adapte conforme necessário para o fluxo real
];
