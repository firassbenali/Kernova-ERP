import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contract, ContractStatus } from '../../domain/models/contract.model';

const BASE = '/api/contracts';

@Injectable({ providedIn: 'root' })
export class ContractService {
  constructor(private http: HttpClient) {}

  getAll(clientId?: number): Observable<Contract[]> {
    let params = new HttpParams();
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<Contract[]>(BASE, { params });
  }

  getById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${BASE}/${id}`);
  }

  create(contract: Partial<Contract>): Observable<Contract> {
    return this.http.post<Contract>(BASE, contract);
  }

  updateStatus(id: number, status: ContractStatus): Observable<Contract> {
    let params = new HttpParams().set('status', status);
    return this.http.patch<Contract>(`${BASE}/${id}/status`, null, { params });
  }

  signContract(id: number, signedBy: string): Observable<Contract> {
    let params = new HttpParams().set('signedBy', signedBy);
    return this.http.post<Contract>(`${BASE}/${id}/sign`, null, { params });
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${BASE}/${id}/pdf`, { responseType: 'blob' });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
