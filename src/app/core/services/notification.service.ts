import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Notification } from '../../domain/models/notification.model';

const BASE = '/api/notifications';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  private _unreadCount = new BehaviorSubject<number>(0);
  /** Reactive unread count — subscribe in topbar to keep badge live */
  readonly unreadCount$ = this._unreadCount.asObservable();

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(BASE).pipe(
      tap(list => this._unreadCount.next((list || []).filter(n => !n.read).length))
    );
  }

  getByUser(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/user/${userId}`);
  }

  getByClient(clientId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${BASE}/client/${clientId}`).pipe(
      tap(list => this._unreadCount.next((list || []).filter(n => !n.read).length))
    );
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${BASE}/${id}/read`, null);
  }

  /** Call after marking notifications as read to push updated count */
  setUnreadCount(count: number): void {
    this._unreadCount.next(count);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
