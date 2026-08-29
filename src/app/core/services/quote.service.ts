import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quote, QuoteStatus } from '../../domain/models/quote.model';

const BASE = '/api/quotes';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  constructor(private http: HttpClient) {}

  getAll(clientId?: number): Observable<Quote[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<Quote[]>(BASE, { params });
  }

  getById(id: number): Observable<Quote> {
    return this.http.get<Quote>(`${BASE}/${id}`);
  }

  create(quote: Partial<Quote>): Observable<Quote> {
    return this.http.post<Quote>(BASE, quote);
  }

  updateStatus(id: number, status: QuoteStatus): Observable<Quote> {
    let params = new HttpParams().set('status', status);
    return this.http.patch<Quote>(`${BASE}/${id}/status`, null, { params });
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${BASE}/${id}/pdf`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
