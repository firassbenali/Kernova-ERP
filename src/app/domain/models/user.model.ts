export interface UserResponse {
  id: number;
  username: string;
  email: string;
  status: string;
  role?: string | null;
  createdAt?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  roleId?: number;
}
