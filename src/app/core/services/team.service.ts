import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '../../domain/models/team.model';

const BASE = '/api/teams';

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Team[]> {
    return this.http.get<Team[]>(BASE);
  }

  getById(id: number): Observable<Team> {
    return this.http.get<Team>(`${BASE}/${id}`);
  }

  create(request: CreateTeamRequest): Observable<Team> {
    return this.http.post<Team>(BASE, request);
  }

  update(id: number, request: UpdateTeamRequest): Observable<Team> {
    return this.http.put<Team>(`${BASE}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  addMember(teamId: number, employeeId: number): Observable<Team> {
    return this.http.post<Team>(`${BASE}/${teamId}/members/${employeeId}`, null);
  }

  removeMember(teamId: number, employeeId: number): Observable<Team> {
    return this.http.delete<Team>(`${BASE}/${teamId}/members/${employeeId}`);
  }
}
