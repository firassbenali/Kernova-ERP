export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: number;
  clientId?: number | null;
  contractId?: number | null;
  name: string;
  description: string;
  budget: number;
  priority: ProjectPriority;
  status: ProjectStatus;
  currentPhase: string;
  progress: number;
  startDate: string;
  endDate: string;
}

export interface ProjectFilters {
  name?: string;
  status?: string;
  currentPhase?: string;
  priority?: string;
}
