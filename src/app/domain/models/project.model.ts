export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectPhase = 'INITIATION' | 'PLANNING' | 'EXECUTION' | 'MONITORING' | 'CLOSING';

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

export interface ProjectBudgetItem {
  id: number;
  name: string;
  budget: number;
  status: ProjectStatus;
}

export interface ProjectBudgetStats {
  total: number;
  average: number;
  max: number;
  min: number;
  projectCount: number;
}

export interface ProjectBudgetReport {
  items: ProjectBudgetItem[];
  stats: ProjectBudgetStats;
}

export interface ProjectSummaryReport {
  id: number;
  name: string;
  status: ProjectStatus;
  currentPhase: string;
  progress: number;
  budget: number;
  startDate: string;
  endDate: string;
  taskCount?: number;
  completedTasksCount?: number;
  documentCount?: number;
  teamSize?: number;
}

