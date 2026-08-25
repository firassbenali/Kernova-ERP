import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../../domain/models/skill.model';
import { SkillCategory } from '../../domain/models/skill.model';

const BASE = '/api/skills';

@Injectable({ providedIn: 'root' })
export class SkillService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Skill[]> {
    return this.http.get<Skill[]>(BASE);
  }

  getById(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${BASE}/${id}`);
  }

  create(data: { name: string; category?: SkillCategory; description?: string }): Observable<Skill> {
    return this.http.post<Skill>(BASE, data);
  }

  update(id: number, data: { name?: string; category?: SkillCategory; description?: string; active?: boolean }): Observable<Skill> {
    return this.http.put<Skill>(`${BASE}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  getActive(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${BASE}/active`);
  }

  getByCategory(category: SkillCategory): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${BASE}/category/${category}`);
  }

  search(keyword: string): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${BASE}/search/${keyword}`);
  }
}