import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectFilters, ProjectBudgetReport, ProjectSummaryReport } from '../../domain/models/project.model';
import { ProjectDocument } from '../../domain/models/project-document.model';
import { Notification } from '../../domain/models/notification.model';

const BASE = '/api/projects';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}

  getAll(filters?: ProjectFilters): Observable<Project[]> {
    let params = new HttpParams();
    if (filters?.name)         params = params.set('name', filters.name);
    if (filters?.status)       params = params.set('status', filters.status);
    if (filters?.currentPhase) params = params.set('currentPhase', filters.currentPhase);
    if (filters?.priority)     params = params.set('priority', filters.priority);
    return this.http.get<Project[]>(BASE, { params });
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${BASE}/${id}`);
  }

  getSummary(id: number): Observable<ProjectSummaryReport> {
    return this.http.get<ProjectSummaryReport>(`${BASE}/${id}/summary`);
  }

  create(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(BASE, project);
  }

  update(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${BASE}/${id}`, project);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<Project> {
    return this.http.patch<Project>(`${BASE}/${id}/status`, null, { params: { status } });
  }

  updatePhase(id: number, phase: string): Observable<Project> {
    return this.http.patch<Project>(`${BASE}/${id}/phase`, null, { params: { phase } });
  }

  updateProgress(id: number, progress: number): Observable<Project> {
    return this.http.patch<Project>(`${BASE}/${id}/progress`, null, { params: { progress: progress.toString() } });
  }

  updateBudget(id: number, budget: number): Observable<Project> {
    return this.http.patch<Project>(`${BASE}/${id}/budget`, null, { params: { budget: budget.toString() } });
  }

  updateDeadline(id: number, endDate: string): Observable<Project> {
    return this.http.patch<Project>(`${BASE}/${id}/deadline`, null, { params: { endDate } });
  }

  // Documents
  getDocuments(projectId: number): Observable<ProjectDocument[]> {
    return this.http.get<ProjectDocument[]>(`${BASE}/${projectId}/documents`);
  }

  uploadDocument(projectId: number, formData: FormData): Observable<ProjectDocument> {
    return this.http.post<ProjectDocument>(`${BASE}/${projectId}/documents`, formData);
  }

  downloadDocument(docId: number): Observable<Blob> {
    return this.http.get(`${BASE}/documents/${docId}/download`, { responseType: 'blob' });
  }

  deleteDocument(docId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/documents/${docId}`);
  }

  updateDocumentVersion(docId: number, formData: FormData): Observable<ProjectDocument> {
    return this.http.put<ProjectDocument>(`${BASE}/documents/${docId}/version`, formData);
  }

  // Notifications / Delays
  checkDelays(): Observable<Notification[]> {
    return this.http.post<Notification[]>(`${BASE}/check-delays`, null);
  }

  getDelayNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/notifications`);
  }

  // Reports
  getProgressReport(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${BASE}/reports/progress`);
  }

  getBudgetReport(): Observable<ProjectBudgetReport> {
    return this.http.get<ProjectBudgetReport>(`${BASE}/reports/budget`);
  }
}
