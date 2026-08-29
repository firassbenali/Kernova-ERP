import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, PaymentStatus } from '../../domain/models/invoice.model';

const BASE = '/api/invoices';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  constructor(private http: HttpClient) {}

  getAll(clientId?: number): Observable<Invoice[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<Invoice[]>(BASE, { params });
  }

  getById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${BASE}/${id}`);
  }

  create(invoice: Partial<Invoice>): Observable<Invoice> {
    return this.http.post<Invoice>(BASE, invoice);
  }

  createFromContract(contractId: number, taxPercentage: number = 19.0): Observable<Invoice> {
    let params = new HttpParams().set('taxPercentage', taxPercentage.toString());
    return this.http.post<Invoice>(`${BASE}/from-contract/${contractId}`, null, { params });
  }

  updatePaymentStatus(id: number, status: PaymentStatus): Observable<Invoice> {
    let params = new HttpParams().set('status', status);
    return this.http.patch<Invoice>(`${BASE}/${id}/payment-status`, null, { params });
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${BASE}/${id}/pdf`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
