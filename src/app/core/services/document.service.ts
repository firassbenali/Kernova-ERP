import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentModel } from '../../domain/models/document.model';

const BASE = '/api/documents';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  getDocuments(clientId?: number, category?: string): Observable<DocumentModel[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId.toString());
    if (category) params = params.set('category', category);
    return this.http.get<DocumentModel[]>(BASE, { params });
  }

  getById(id: number): Observable<DocumentModel> {
    return this.http.get<DocumentModel>(`${BASE}/${id}`);
  }

  uploadDocument(
    file: File,
    clientId?: number,
    uploadedBy?: number,
    title?: string,
    category?: string,
    description?: string,
    version?: string
  ): Observable<DocumentModel> {
    const formData = new FormData();
    formData.append('file', file);
    if (clientId) formData.append('clientId', clientId.toString());
    if (uploadedBy) formData.append('uploadedBy', uploadedBy.toString());
    if (title) formData.append('title', title);
    if (category) formData.append('category', category);
    if (description) formData.append('description', description);
    if (version) formData.append('version', version);

    return this.http.post<DocumentModel>(`${BASE}/upload`, formData);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${BASE}/${id}/download`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
