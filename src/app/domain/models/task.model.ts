export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Task {
  id: number;
  projectId: number;
  projectName: string;
  employeeId: number;
  employeeName: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}

export interface CreateTaskRequest {
  projectId: number;
  employeeId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
}

export interface UpdateTaskRequest extends CreateTaskRequest {}
