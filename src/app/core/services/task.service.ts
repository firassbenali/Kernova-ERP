import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest } from '../../domain/models/task.model';

const BASE = '/api/tasks';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(BASE);
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${BASE}/${id}`);
  }

  getByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${BASE}/project/${projectId}`);
  }

  getByEmployee(employeeId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${BASE}/employee/${employeeId}`);
  }

  getByStatus(status: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${BASE}/status/${status}`);
  }

  create(request: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(BASE, request);
  }

  update(id: number, request: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${BASE}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
