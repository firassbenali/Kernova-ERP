export type WorkloadStatus = 'AVAILABLE' | 'UNDERUTILIZED' | 'OPTIMAL' | 'HIGH' | 'OVERALLOCATED';

export interface TrendPoint {
  periodLabel: string;
  averageScore: number;
  reviewCount: number;
}

export interface ResourceAllocation {
  id: number;
  employeeId: number;
  employeeName: string;
  projectId: number;
  projectName: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string | null;
  status: string;
}

export interface ProjectAllocationSummary {
  projectId: number;
  projectName: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string | null;
}

export interface TaskSummary {
  taskId: number;
  title: string;
  projectName: string | null;
  priority: string;
  status: string;
  deadline: string | null;
}

export interface EmployeeWorkload {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  availability: string;
  currentProjects: ProjectAllocationSummary[];
  currentTasks: TaskSummary[];
  totalAllocation: number;
  workloadStatus: WorkloadStatus;
  assignedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completedTasks: number;
}

export interface EmployeeAllocationSummary {
  employeeId: number;
  employeeName: string;
  department: string;
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string | null;
}

export interface ProjectAllocation {
  projectId: number;
  projectName: string;
  projectStatus: string;
  projectStartDate: string | null;
  projectEndDate: string | null;
  allocations: EmployeeAllocationSummary[];
  totalAllocation: number;
  taskCount: number;
}

export interface WorkloadTrendPoint {
  period: string;
  averageWorkload: number;
}

export interface EmployeeAllocationInfo {
  employeeId: number;
  employeeName: string;
  allocationPercentage: number;
}

export interface ResourcePlanningDashboardStats {
  totalEmployees: number;
  availableEmployees: number;
  fullyAllocatedEmployees: number;
  overallocatedEmployees: number;
  underutilizedEmployees: number;
  activeProjects: number;
  averageWorkload: number;
  workloadByDepartment: Record<string, number>;
  allocationByProject: Record<string, number>;
  utilizationDistribution: Record<string, number>;
  workloadTrend: WorkloadTrendPoint[];
  fullyAllocatedEmployeesList: EmployeeAllocationInfo[];
  underutilizedEmployeesList: EmployeeAllocationInfo[];
}

export interface ResourceAllocationFilters {
  employeeId?: number;
  projectId?: number;
  departmentId?: number;
  workloadStatus?: WorkloadStatus;
  search?: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}