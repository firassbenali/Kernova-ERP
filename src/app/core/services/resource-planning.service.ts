import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ResourceAllocation,
  EmployeeWorkload,
  ProjectAllocation,
  ResourcePlanningDashboardStats,
  PageResponse,
  ResourceAllocationFilters,
  WorkloadStatus,
} from '../../domain/models/resource-planning.model';

const BASE = '/api/resource-planning';

@Injectable({ providedIn: 'root' })
export class ResourcePlanningService {
  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboardStats(): Observable<ResourcePlanningDashboardStats> {
    return this.http.get<ResourcePlanningDashboardStats>(`${BASE}/dashboard`);
  }

  // Allocations
  getAllocations(filters: ResourceAllocationFilters = {}): Observable<PageResponse<ResourceAllocation>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 1))
      .set('size', String(filters.size ?? 10));

    if (filters.employeeId != null) params = params.set('employeeId', String(filters.employeeId));
    if (filters.projectId != null) params = params.set('projectId', String(filters.projectId));
    if (filters.departmentId != null) params = params.set('departmentId', String(filters.departmentId));
    if (filters.workloadStatus) params = params.set('workloadStatus', filters.workloadStatus);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<PageResponse<ResourceAllocation>>(`${BASE}/allocations`, { params });
  }

  getAllocationById(id: number): Observable<ResourceAllocation> {
    return this.http.get<ResourceAllocation>(`${BASE}/allocations/${id}`);
  }

  createAllocation(request: {
    employeeId: number;
    projectId: number;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
    role?: string | null;
  }): Observable<ResourceAllocation> {
    return this.http.post<ResourceAllocation>(`${BASE}/allocations`, request);
  }

  updateAllocation(id: number, request: {
    allocationPercentage?: number;
    startDate?: string;
    endDate?: string;
    role?: string | null;
    status?: string;
  }): Observable<ResourceAllocation> {
    return this.http.put<ResourceAllocation>(`${BASE}/allocations/${id}`, request);
  }

  deleteAllocation(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/allocations/${id}`);
  }

  getAllocationsByEmployee(employeeId: number): Observable<ResourceAllocation[]> {
    return this.http.get<ResourceAllocation[]>(`${BASE}/allocations/employee/${employeeId}`);
  }

  getAllocationsByProject(projectId: number): Observable<ResourceAllocation[]> {
    return this.http.get<ResourceAllocation[]>(`${BASE}/allocations/project/${projectId}`);
  }

  // Employee Workload
  getEmployeeWorkload(employeeId: number, referenceDate?: string): Observable<EmployeeWorkload> {
    let params = new HttpParams();
    if (referenceDate) params = params.set('referenceDate', referenceDate);
    return this.http.get<EmployeeWorkload>(`${BASE}/employees/${employeeId}/workload`, { params });
  }

  // Project Allocation
  getProjectAllocation(projectId: number): Observable<ProjectAllocation> {
    return this.http.get<ProjectAllocation>(`${BASE}/projects/${projectId}/allocation`);
  }
}