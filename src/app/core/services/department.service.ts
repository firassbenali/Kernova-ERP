import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Department } from '../../domain/models/department.model';

const BASE = '/api/departments';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(BASE);
  }

  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${BASE}/${id}`);
  }

  create(department: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(BASE, department);
  }

  update(id: number, department: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${BASE}/${id}`, department);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
