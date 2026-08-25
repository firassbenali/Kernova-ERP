export interface Employee {
  id: number;
  userId: number;
  username: string;
  userEmail: string;
  departmentId: number;
  departmentName: string;
  positionId: number;
  positionTitle: string;
  phone: string;
  hireDate: string;
  availability: string;
}

export interface CreateEmployeeRequest {
  userId: number;
  departmentId: number;
  positionId: number;
  phone: string;
  hireDate: string;
  availability: string;
}

export interface UpdateEmployeeRequest {
  departmentId: number;
  positionId: number;
  phone: string;
  hireDate: string;
  availability: string;
}
