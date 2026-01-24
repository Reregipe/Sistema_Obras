// src/types/WorkflowStep.ts

export type WorkflowStepStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

export interface WorkflowStep {
  id: number;
  name: string;
  status: WorkflowStepStatus;
  ordem: number;
  count?: number;
  // Add more fields as needed based on usage in WorkflowSteps.tsx
}
