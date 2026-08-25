import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notification } from '../../domain/models/notification.model';

const BASE = '/api/notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(BASE);
  }

  getByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/user/${userId}`);
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${BASE}/${id}/read`, null);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
