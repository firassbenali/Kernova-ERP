import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, ClientFilters, Contact } from '../../domain/models/client.model';

const BASE = '/api/clients';

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private http: HttpClient) {}

  getAll(filters?: ClientFilters): Observable<Client[]> {
    let params = new HttpParams();
    if (filters?.query) params = params.set('query', filters.query);
    if (filters?.sector) params = params.set('sector', filters.sector);
    if (filters?.city) params = params.set('city', filters.city);
    if (filters?.country) params = params.set('country', filters.country);

    return this.http.get<Client[]>(BASE, { params });
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${BASE}/${id}`);
  }

  getByUserId(userId: number): Observable<Client> {
    return this.http.get<Client>(`${BASE}/by-user/${userId}`);
  }

  create(client: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(BASE, client);
  }

  update(id: number, client: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${BASE}/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  // --- Contacts ---
  getContacts(clientId: number): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${BASE}/${clientId}/contacts`);
  }

  addContact(clientId: number, contact: Partial<Contact>): Observable<Contact> {
    return this.http.post<Contact>(`${BASE}/${clientId}/contacts`, contact);
  }

  updateContact(clientId: number, contactId: number, contact: Partial<Contact>): Observable<Contact> {
    return this.http.put<Contact>(`${BASE}/${clientId}/contacts/${contactId}`, contact);
  }

  setPrimaryContact(clientId: number, contactId: number): Observable<Contact> {
    return this.http.patch<Contact>(`${BASE}/${clientId}/contacts/${contactId}/primary`, {});
  }

  deleteContact(clientId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${clientId}/contacts/${contactId}`);
  }
}
