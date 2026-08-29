import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../domain/models/client.model';

const BASE = '/api/clients';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient) {}

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${BASE}/appointments`);
  }

  getByClient(clientId: number): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${BASE}/${clientId}/appointments`);
  }

  getById(clientId: number, appointmentId: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${BASE}/${clientId}/appointments/${appointmentId}`);
  }

  create(clientId: number, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${BASE}/${clientId}/appointments`, appointment);
  }

  createPortalAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.post<Appointment>(`${BASE}/appointments`, appointment);
  }

  update(clientId: number, appointmentId: number, appointment: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${BASE}/${clientId}/appointments/${appointmentId}`, appointment);
  }

  updateStatus(clientId: number, appointmentId: number, status: AppointmentStatus): Observable<Appointment> {
    return this.http.patch<Appointment>(`${BASE}/${clientId}/appointments/${appointmentId}/status`, { status });
  }

  delete(clientId: number, appointmentId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${clientId}/appointments/${appointmentId}`);
  }
}
