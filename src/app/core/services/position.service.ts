import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Position } from '../../domain/models/position.model';

const BASE = '/api/positions';

@Injectable({ providedIn: 'root' })
export class PositionService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Position[]> {
    return this.http.get<Position[]>(BASE);
  }

  getById(id: number): Observable<Position> {
    return this.http.get<Position>(`${BASE}/${id}`);
  }

  create(data: { title: string }): Observable<Position> {
    return this.http.post<Position>(BASE, data);
  }

  update(id: number, data: { title: string }): Observable<Position> {
    return this.http.put<Position>(`${BASE}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
