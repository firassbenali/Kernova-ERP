import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../domain/models/employee.model';
import { EmployeeSkill, AssignSkillRequest, UpdateSkillLevelRequest } from '../../domain/models/employee-skill.model';

const BASE = '/api/employees';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(BASE);
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${BASE}/${id}`);
  }

  getByDepartment(departmentId: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${BASE}/department/${departmentId}`);
  }

  getByPosition(positionId: number): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${BASE}/position/${positionId}`);
  }

  create(request: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(BASE, request);
  }

  update(id: number, request: UpdateEmployeeRequest): Observable<Employee> {
    return this.http.put<Employee>(`${BASE}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  // Employee Skills
  getSkills(employeeId: number): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(`${BASE}/${employeeId}/skills`);
  }

  assignSkill(employeeId: number, request: AssignSkillRequest): Observable<EmployeeSkill> {
    return this.http.post<EmployeeSkill>(`${BASE}/${employeeId}/skills`, request);
  }

  updateSkillLevel(employeeId: number, skillId: number, request: UpdateSkillLevelRequest): Observable<EmployeeSkill> {
    return this.http.put<EmployeeSkill>(`${BASE}/${employeeId}/skills/${skillId}`, request);
  }

  removeSkill(employeeId: number, skillId: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${employeeId}/skills/${skillId}`);
  }

  getSkillsWithDetails(employeeId: number): Observable<EmployeeSkill[]> {
    return this.http.get<EmployeeSkill[]>(`${BASE}/${employeeId}/skills/details`);
  }

  assignSkillWithDetails(
      employeeId: number, skillId: number, level: string,
      targetLevel: string, yearsOfExperience: number): Observable<EmployeeSkill> {
    return this.http.post<EmployeeSkill>(
        `${BASE}/${employeeId}/skills/details`,
        { skillId, level, targetLevel, yearsOfExperience }
    );
  }

  calculateSkillGap(employeeId: number, skillId: number): Observable<string> {
    return this.http.get<string>(
        `${BASE}/${employeeId}/skills/${skillId}/gap`
    );
  }

  calculateSkillGapForProject(
      employeeId: number, skillId: number, requiredLevel: string): Observable<string> {
    return this.http.get<string>(
        `${BASE}/${employeeId}/skills/${skillId}/gap/project?requiredLevel=${requiredLevel}`
    );
  }
}