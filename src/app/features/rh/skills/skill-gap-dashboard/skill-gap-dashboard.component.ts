import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { EmployeeService } from '../../../../core/services/employee.service';
import { SkillService } from '../../../../core/services/skill.service';
import { Employee } from '../../../../domain/models/employee.model';
import { Skill, SkillCategory } from '../../../../domain/models/skill.model';
import { EmployeeSkill, SkillLevel } from '../../../../domain/models/employee-skill.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { TrendChartComponent } from '../../../../shared/components/trend-chart/trend-chart.component';

interface SkillGapData {
  skill: Skill;
  employeesWithSkill: number;
  avgCurrentLevel: number;
  avgTargetLevel: number;
  avgGap: number;
  gapPercentage: number;
  mandatoryForPositions: number;
}

interface DepartmentSkillDistribution {
  department: string;
  skillCount: number;
  avgLevel: number;
}

@Component({
  selector: 'app-skill-gap-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    LoadingOverlayComponent,
    TrendChartComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Skill Gap Dashboard</h1>
        <p class="subtitle">Analyze skill gaps across the organization</p>
      </div>

      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Category</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()">
            <mat-option value="">All Categories</mat-option>
            <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Department</mat-label>
          <mat-select [(ngModel)]="selectedDepartment" (ngModelChange)="onFilterChange()">
            <mat-option value="">All Departments</mat-option>
            <mat-option *ngFor="let dept of departments" [value]="dept">{{ dept }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div style="position: relative;">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        <ng-container *ngIf="!loading()">
          <!-- KPI Row -->
          <div class="kpi-row">
            <mat-card class="kpi-card">
              <mat-card-content>
                <div class="kpi-content">
                  <mat-icon class="kpi-icon" [fontIcon]="'psychology'"></mat-icon>
                  <div>
                    <div class="kpi-value">{{ totalSkills }}</div>
                    <div class="kpi-label">Total Skills in Catalog</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="kpi-card">
              <mat-card-content>
                <div class="kpi-content">
                  <mat-icon class="kpi-icon warning" [fontIcon]="'warning'"></mat-icon>
                  <div>
                    <div class="kpi-value">{{ skillsWithHighestGaps }}</div>
                    <div class="kpi-label">Skills with Highest Gaps</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="kpi-card">
              <mat-card-content>
                <div class="kpi-content">
                  <mat-icon class="kpi-icon success" [fontIcon]="'emoji_events'"></mat-icon>
                  <div>
                    <div class="kpi-value">{{ employeesStrongestCompetencies }}</div>
                    <div class="kpi-label">Employees with Strongest Competencies</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="kpi-card">
              <mat-card-content>
                <div class="kpi-content">
                  <mat-icon class="kpi-icon info" [fontIcon]="'school'"></mat-icon>
                  <div>
                    <div class="kpi-value">{{ employeesRequiringDevelopment }}</div>
                    <div class="kpi-label">Employees Requiring Development</div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Charts Row -->
          <div class="charts-row">
            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>Skill Gap Trend</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-wrapper">
                  <app-trend-chart [points]="gapTrendPoints()"></app-trend-chart>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>Skill Distribution by Department</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="dept-distribution">
                  <div class="dept-bar" *ngFor="let dept of departmentDistribution()">
                    <div class="dept-bar-header">
                      <span class="dept-name">{{ dept.department }}</span>
                      <span class="dept-count">{{ dept.skillCount }} skills</span>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="dept.avgLevel * 25"></mat-progress-bar>
                    <small>{{ dept.avgLevel | number:'1.1-1' }} avg level</small>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Most Common Skills -->
          <mat-card class="skills-table-card">
            <mat-card-header>
              <mat-card-title>Most Common Skills</mat-card-title>
              <mat-card-subtitle>Skills with highest employee count</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="mostCommonSkills()" class="skills-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Skill</th>
                  <td mat-cell *matCellDef="let skill">
                    <mat-chip>{{ skill.skill.category }}</mat-chip>
                    {{ skill.skill.name }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="employees">
                  <th mat-header-cell *matHeaderCellDef>Employees</th>
                  <td mat-cell *matCellDef="let skill">{{ skill.employeesWithSkill }}</td>
                </ng-container>
                <ng-container matColumnDef="avgCurrent">
                  <th mat-header-cell *matHeaderCellDef>Avg Current Level</th>
                  <td mat-cell *matCellDef="let skill">{{ skill.avgCurrentLevel | number:'1.1-1' }}</td>
                </ng-container>
                <ng-container matColumnDef="avgTarget">
                  <th mat-header-cell *matHeaderCellDef>Avg Target Level</th>
                  <td mat-cell *matCellDef="let skill">{{ skill.avgTargetLevel | number:'1.1-1' }}</td>
                </ng-container>
                <ng-container matColumnDef="gap">
                  <th mat-header-cell *matHeaderCellDef>Avg Gap</th>
                  <td mat-cell *matCellDef="let skill">
                    <mat-progress-bar mode="determinate" [value]="skill.gapPercentage" color="warn" style="width: 100px;"></mat-progress-bar>
                    {{ skill.avgGap | number:'1.1-1' }}
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="commonSkillsColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: commonSkillsColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Skills with Highest Gaps -->
          <mat-card class="skills-table-card">
            <mat-card-header>
              <mat-card-title>Skills with Highest Gaps</mat-card-title>
              <mat-card-subtitle>Skills where employees need the most development</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="highestGapSkills()" class="skills-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Skill</th>
                  <td mat-cell *matCellDef="let skill">
                    <mat-chip>{{ skill.skill.category }}</mat-chip>
                    {{ skill.skill.name }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="employees">
                  <th mat-header-cell *matHeaderCellDef>Employees</th>
                  <td mat-cell *matCellDef="let skill">{{ skill.employeesWithSkill }}</td>
                </ng-container>
                <ng-container matColumnDef="avgGap">
                  <th mat-header-cell *matHeaderCellDef>Avg Gap</th>
                  <td mat-cell *matCellDef="let skill">
                    <mat-chip class="gap-chip" [class]="getGapClass(skill.avgGap)">
                      {{ skill.avgGap | number:'1.1-1' }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="mandatory">
                  <th mat-header-cell *matHeaderCellDef>Mandatory for Positions</th>
                  <td mat-cell *matCellDef="let skill">{{ skill.mandatoryForPositions }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="gapSkillsColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: gapSkillsColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Employees Requiring Development -->
          <mat-card class="skills-table-card">
            <mat-card-header>
              <mat-card-title>Employees Requiring Development</mat-card-title>
              <mat-card-subtitle>Employees with largest skill gaps</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="employeesNeedingDevelopment()" class="skills-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Employee</th>
                  <td mat-cell *matCellDef="let emp">{{ emp.name }}</td>
                </ng-container>
                <ng-container matColumnDef="department">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let emp">{{ emp.department }}</td>
                </ng-container>
                <ng-container matColumnDef="totalGap">
                  <th mat-header-cell *matHeaderCellDef>Total Gap</th>
                  <td mat-cell *matCellDef="let emp">
                    <mat-chip class="gap-chip" [class]="getGapClass(emp.totalGap)">{{ emp.totalGap }}</mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="skillsWithGap">
                  <th mat-header-cell *matHeaderCellDef>Skills with Gap</th>
                  <td mat-cell *matCellDef="let emp">{{ emp.skillsWithGap }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="devEmployeesColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: devEmployeesColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-muted); font-size: 13px; margin: 4px 0 0; }

    .filters-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .filter-field { min-width: 200px; }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card { padding: 20px !important; }
    .kpi-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .kpi-icon { font-size: 28px; color: var(--color-primary); }
    .kpi-icon.warning { color: #D97706; }
    .kpi-icon.success { color: #16A34A; }
    .kpi-icon.info { color: #3B82F6; }
    .kpi-value { font-size: 28px; font-weight: 700; line-height: 1; }
    .kpi-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .charts-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-card, .skills-table-card { padding: 20px !important; }
    .chart-wrapper { height: 250px; }

    .dept-distribution { display: flex; flex-direction: column; gap: 16px; }
    .dept-bar-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .dept-name { font-weight: 500; }
    .dept-count { color: var(--color-text-muted); font-size: 12px; }
    .dept-bar ::ng-deep .mat-mdc-progress-bar { height: 8px; border-radius: 4px; }

    .skills-table { width: 100%; }
    th.mat-header-cell, td.mat-cell { padding: 12px 16px; }

    .gap-chip {
      font-size: 11px;
      font-weight: 600;
    }
    .gap-chip.low { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .gap-chip.medium { background: rgba(217, 119, 6, 0.15); color: #D97706; }
    .gap-chip.high { background: rgba(220, 38, 38, 0.15); color: #DC2626; }

    @media (max-width: 1100px) {
      .charts-row { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-row { grid-template-columns: 1fr; }
    }
  `],
})
export class SkillGapDashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private skillService = inject(SkillService);

  loading = signal(true);

  // Filter state
  selectedCategory: string = '';
  selectedDepartment: string = '';
  categories: string[] = [
    SkillCategory.Technical,
    SkillCategory.SoftSkill,
    SkillCategory.Management,
    SkillCategory.Language,
    SkillCategory.Certification,
    SkillCategory.Domain,
  ];
  departments: string[] = [];

  // Data
  allEmployees: Employee[] = [];
  allSkills: Skill[] = [];
  allEmployeeSkills: EmployeeSkill[] = [];

  // Computed
  totalSkills = 0;
  skillsWithHighestGaps = 0;
  employeesStrongestCompetencies = 0;
  employeesRequiringDevelopment = 0;

  commonSkillsColumns = ['name', 'employees', 'avgCurrent', 'avgTarget', 'gap'];
  gapSkillsColumns = ['name', 'employees', 'avgGap', 'mandatory'];
  devEmployeesColumns = ['name', 'department', 'totalGap', 'skillsWithGap'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.employeeService.getAll().subscribe({
      next: (employees) => {
        this.allEmployees = employees;
        this.departments = [...new Set(employees.map(e => e.departmentName))].filter(Boolean);
        this.skillService.getAll().subscribe({
          next: (skills) => {
            this.allSkills = skills;
            this.loadAllEmployeeSkills();
          },
          error: (err) => {
            console.error('Failed to load skills', err);
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.loading.set(false);
      }
    });
  }

  loadAllEmployeeSkills(): void {
    let loaded = 0;
    const total = this.allEmployees.length;

    this.allEmployees.forEach(emp => {
      this.employeeService.getSkills(emp.id).subscribe({
        next: (skills) => {
          this.allEmployeeSkills.push(...skills.map(s => ({ ...s })));
          loaded++;
          if (loaded === total) {
            this.computeDashboardData();
            this.loading.set(false);
          }
        },
        error: () => {
          loaded++;
          if (loaded === total) {
            this.computeDashboardData();
            this.loading.set(false);
          }
        }
      });
    });

    if (total === 0) {
      this.computeDashboardData();
      this.loading.set(false);
    }
  }

  onFilterChange(): void {
    this.computeDashboardData();
  }

  computeDashboardData(): void {
    this.totalSkills = this.allSkills.length;

    // Compute skill gaps
    const skillGaps = this.computeSkillGaps();

    // Most common skills
    this.skillsWithHighestGaps = skillGaps.filter(s => s.avgGap > 1).length;

    // Employees with strongest competencies
    this.employeesStrongestCompetencies = this.computeStrongestEmployees().length;

    // Employees requiring development
    this.employeesRequiringDevelopment = this.computeEmployeesNeedingDevelopment().filter(e => e.totalGap > 1).length;
  }

  computeSkillGaps(): SkillGapData[] {
    const skillMap = new Map<number, SkillGapData>();

    this.allSkills.forEach(skill => {
      skillMap.set(skill.id, {
        skill,
        employeesWithSkill: 0,
        avgCurrentLevel: 0,
        avgTargetLevel: 0,
        avgGap: 0,
        gapPercentage: 0,
        mandatoryForPositions: 0,
      });
    });

    let totalCurrent = 0;
    let count = 0;

    this.allEmployeeSkills.forEach(empSkill => {
      const data = skillMap.get(empSkill.skillId);
      if (data) {
        data.employeesWithSkill++;
        totalCurrent += this.getLevelIndex(empSkill.level);
        data.avgTargetLevel += this.getLevelIndex(empSkill.targetLevel || empSkill.level);
        count++;
      }
    });

    skillMap.forEach(data => {
      if (data.employeesWithSkill > 0) {
        data.avgCurrentLevel = totalCurrent / data.employeesWithSkill;
        data.avgTargetLevel = data.avgTargetLevel / data.employeesWithSkill;
        data.avgGap = data.avgTargetLevel - data.avgCurrentLevel;
        data.gapPercentage = data.avgTargetLevel > 0 ? (data.avgGap / data.avgTargetLevel) * 100 : 0;
      }
    });

    return Array.from(skillMap.values()).filter(s => s.employeesWithSkill > 0);
  }

  mostCommonSkills = signal<SkillGapData[]>([]);
  highestGapSkills = signal<SkillGapData[]>([]);
  gapTrendPoints = signal<any[]>([]);
  departmentDistribution = signal<DepartmentSkillDistribution[]>([]);
  employeesNeedingDevelopment = signal<any[]>([]);

  getLevelIndex(level: string): number {
    const levels: { [key: string]: number } = {
      'BEGINNER': 1,
      'INTERMEDIATE': 2,
      'ADVANCED': 3,
      'EXPERT': 4,
    };
    return levels[level] || 0;
  }

  getGapClass(gap: number): string {
    if (gap <= 0.5) return 'low';
    if (gap <= 1.5) return 'medium';
    return 'high';
  }

  computeStrongestEmployees(): any[] {
    const empMap = new Map<number, { name: string; department: string; totalLevel: number; skillCount: number }>();

    this.allEmployeeSkills.forEach(skill => {
      const emp = this.allEmployees.find(e => e.id === skill.employeeId);
      if (!emp) return;

      const existing = empMap.get(emp.id) || {
        name: `${emp.username}`,
        department: emp.departmentName,
        totalLevel: 0,
        skillCount: 0,
      };

      existing.totalLevel += this.getLevelIndex(skill.level);
      existing.skillCount++;
      empMap.set(emp.id, existing);
    });

    return Array.from(empMap.values())
      .filter(e => e.skillCount > 0)
      .map(e => ({ ...e, avgLevel: e.totalLevel / e.skillCount }))
      .sort((a, b) => b.avgLevel - a.avgLevel);
  }

  computeEmployeesNeedingDevelopment(): any[] {
    const empMap = new Map<number, { name: string; department: string; totalGap: number; skillsWithGap: number }>();

    this.allEmployeeSkills.forEach(skill => {
      const emp = this.allEmployees.find(e => e.id === skill.employeeId);
      if (!emp) return;

      const existing = empMap.get(emp.id) || {
        name: `${emp.username}`,
        department: emp.departmentName,
        totalGap: 0,
        skillsWithGap: 0,
      };

      const current = this.getLevelIndex(skill.level);
      const target = this.getLevelIndex(skill.targetLevel || skill.level);
      const gap = target - current;

      if (gap > 0) {
        existing.totalGap += gap;
        existing.skillsWithGap++;
      }

      empMap.set(emp.id, existing);
    });

    return Array.from(empMap.values())
      .filter(e => e.skillsWithGap > 0)
      .sort((a, b) => b.totalGap - a.totalGap);
  }
}