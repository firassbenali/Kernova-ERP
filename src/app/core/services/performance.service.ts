import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreatePerformanceReviewRequest,
  EmployeePerformanceSummary,
  PageResponse,
  PerformanceCriterion,
  PerformanceReview,
  PerformanceStats,
  ReviewFilters,
  SaveCriterionRequest,
  UpdatePerformanceReviewRequest,
} from '../../domain/models/performance.model';

const BASE = '/api/performance-reviews';
const CRITERIA_BASE = '/api/performance-criteria';

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  constructor(private http: HttpClient) {}

  getReviews(filters: ReviewFilters = {}): Observable<PageResponse<PerformanceReview>> {
    let params = new HttpParams()
      .set('page', String(filters.page ?? 1))
      .set('size', String(filters.size ?? 10));
    if (filters.employeeId != null) params = params.set('employeeId', String(filters.employeeId));
    if (filters.departmentId != null) params = params.set('departmentId', String(filters.departmentId));
    if (filters.positionId != null) params = params.set('positionId', String(filters.positionId));
    if (filters.reviewerId != null) params = params.set('reviewerId', String(filters.reviewerId));
    if (filters.status) params = params.set('status', filters.status);
    if (filters.period) params = params.set('period', filters.period);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    return this.http.get<PageResponse<PerformanceReview>>(BASE, { params });
  }

  getReviewById(id: number): Observable<PerformanceReview> {
    return this.http.get<PerformanceReview>(`${BASE}/${id}`);
  }

  createReview(request: CreatePerformanceReviewRequest): Observable<PerformanceReview> {
    return this.http.post<PerformanceReview>(BASE, request);
  }

  updateReview(id: number, request: UpdatePerformanceReviewRequest): Observable<PerformanceReview> {
    return this.http.put<PerformanceReview>(`${BASE}/${id}`, request);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  submitReview(id: number): Observable<PerformanceReview> {
    return this.http.post<PerformanceReview>(`${BASE}/${id}/submit`, {});
  }

  approveReview(id: number): Observable<PerformanceReview> {
    return this.http.post<PerformanceReview>(`${BASE}/${id}/approve`, {});
  }

  getStats(): Observable<PerformanceStats> {
    return this.http.get<PerformanceStats>(`${BASE}/stats`);
  }

  getEmployeePerformance(employeeId: number): Observable<EmployeePerformanceSummary> {
    return this.http.get<EmployeePerformanceSummary>(`/api/employees/${employeeId}/performance`);
  }

  getCriteria(activeOnly = false): Observable<PerformanceCriterion[]> {
    return this.http.get<PerformanceCriterion[]>(CRITERIA_BASE, {
      params: new HttpParams().set('activeOnly', String(activeOnly)),
    });
  }

  createCriterion(request: SaveCriterionRequest): Observable<PerformanceCriterion> {
    return this.http.post<PerformanceCriterion>(CRITERIA_BASE, request);
  }

  updateCriterion(id: number, request: SaveCriterionRequest): Observable<PerformanceCriterion> {
    return this.http.put<PerformanceCriterion>(`${CRITERIA_BASE}/${id}`, request);
  }

  deleteCriterion(id: number): Observable<void> {
    return this.http.delete<void>(`${CRITERIA_BASE}/${id}`);
  }
}
