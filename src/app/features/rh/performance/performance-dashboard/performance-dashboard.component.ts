import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, of } from 'rxjs';
import { PerformanceService } from '../../../../core/services/performance.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PerformanceStats } from '../../../../domain/models/performance.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TrendChartComponent } from '../../../../shared/components/trend-chart/trend-chart.component';

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-performance-dashboard',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgFor,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    TrendChartComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Performance Dashboard</h1>
          <p class="subtitle">Company-wide employee performance overview</p>
        </div>
        <ng-container *ngIf="auth.isAdmin()">
          <div class="page-header-actions">
            <a mat-stroked-button routerLink="/rh/performance/reviews">
              <mat-icon>list</mat-icon> All Reviews
            </a>
            <button mat-flat-button color="primary" (click)="openCreate()">
              <mat-icon>add</mat-icon> New Review
            </button>
          </div>
        </ng-container>
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        <ng-container *ngIf="!loading() && !stats(); else hasStats">
          <div class="empty-state-wrapper">
            <app-empty-state
              icon="insights"
              title="No performance data"
              message="Statistics will appear once evaluations are completed."
            />
          </div>
        </ng-container>

        <ng-template #hasStats>
          <ng-container *ngIf="stats(); let s">
            <!-- KPI Row -->
            <div class="kpi-row">
              <mat-card class="kpi-card" *ngFor="let kpi of kpis(s)">
                <div class="kpi-card__icon" [style.background]="kpi.color + '18'" [style.color]="kpi.color">
                  <mat-icon>{{ kpi.icon }}</mat-icon>
                </div>
                <div class="kpi-card__content">
                  <span class="kpi-card__value">{{ kpi.value }}</span>
                  <span class="kpi-card__label">{{ kpi.label }}</span>
                </div>
              </mat-card>
            </div>

            <!-- Main Grid -->
            <div class="main-grid">
              <!-- Left Column: Chart + Department Averages -->
              <div class="left-column">
                <mat-card class="chart-card">
                  <div class="card-header">
                    <h2>Performance Trend</h2>
                  </div>
                  <div class="chart-wrapper">
                    <app-trend-chart [points]="s.trend"></app-trend-chart>
                  </div>
                </mat-card>

                <mat-card class="dept-card">
                  <div class="card-header">
                    <h2>Department Averages</h2>
                  </div>
                  <div *ngIf="s.departmentAverages.length === 0; else deptList">
                    <div class="empty-small">No completed evaluations yet</div>
                  </div>
                  <ng-template #deptList>
                    <div class="dept-list">
                      <div class="dept-row" *ngFor="let dept of s.departmentAverages">
                        <span class="dept-name">{{ dept.departmentName }}</span>
                        <div class="dept-progress">
                          <mat-progress-bar
                            mode="determinate"
                            [value]="dept.averageScore"
                            [color]="scoreColor(dept.averageScore)">
                          </mat-progress-bar>
                          <span class="dept-value">{{ round(dept.averageScore) }}</span>
                        </div>
                      </div>
                    </div>
                  </ng-template>
                </mat-card>
              </div>

              <!-- Right Column: Top Performers + Needs Improvement -->
              <div class="right-column">
                <mat-card class="list-card">
                  <div class="card-header">
                    <h2>Top Performers</h2>
                    <span class="badge">{{ s.topPerformers.length }}</span>
                  </div>
                  <div *ngIf="s.topPerformers.length === 0; else topList">
                    <div class="empty-small">No completed evaluations yet</div>
                  </div>
                  <ng-template #topList>
                    <ul class="employee-list">
                      <li class="employee-item" *ngFor="let employee of s.topPerformers">
                        <a class="employee-link" [routerLink]="['/rh/employees', employee.employeeId, 'performance']">
                          <span class="employee-name">{{ employee.employeeName }}</span>
                          <span class="employee-score good">{{ round(employee.averageScore) }}</span>
                        </a>
                      </li>
                    </ul>
                  </ng-template>
                </mat-card>

                <mat-card class="list-card">
                  <div class="card-header">
                    <h2>Needs Improvement</h2>
                    <span class="badge">{{ s.needsImprovement.length }}</span>
                  </div>
                  <div *ngIf="s.needsImprovement.length === 0; else needsList">
                    <div class="empty-small">No employees below company average</div>
                  </div>
                  <ng-template #needsList>
                    <ul class="employee-list">
                      <li class="employee-item" *ngFor="let employee of s.needsImprovement">
                        <a class="employee-link" [routerLink]="['/rh/employees', employee.employeeId, 'performance']">
                          <span class="employee-name">{{ employee.employeeName }}</span>
                          <span class="employee-score" [ngClass]="scoreClass(employee.averageScore)">{{ round(employee.averageScore) }}</span>
                        </a>
                      </li>
                    </ul>
                  </ng-template>
                </mat-card>
              </div>
            </div>
          </ng-container>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-muted); font-size: 13px; margin: 4px 0 0; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-header-actions { 
      display: flex; 
      gap: 12px; 
      align-items: center;
    }

    .page-header-actions a[mat-stroked-button],
    .page-header-actions button[mat-flat-button] {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .page-header-actions a[mat-stroked-button] {
      background: transparent;
      border: 1.5px solid var(--color-border);
      color: var(--color-text-secondary);
    }

    .page-header-actions a[mat-stroked-button]:hover {
      background: var(--color-surface-alt);
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(27, 58, 107, 0.15);
    }

    .page-header-actions button[mat-flat-button] {
      background: linear-gradient(135deg, var(--color-primary), #2C5F8A);
      color: white;
      border: none;
      box-shadow: 0 2px 8px rgba(27, 58, 107, 0.25);
    }

    .page-header-actions button[mat-flat-button]:hover {
      background: linear-gradient(135deg, #2C5F8A, var(--color-primary));
      box-shadow: 0 6px 20px rgba(27, 58, 107, 0.35);
      transform: translateY(-2px);
    }

    .page-header-actions button[mat-flat-button]:active {
      transform: translateY(0);
    }

    .page-header-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      padding: 20px !important;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .kpi-card__icon {
      width: 48px; height: 48px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
    }
    .kpi-card__value { font-size: 28px; font-weight: 700; line-height: 1; color: var(--color-text-primary); }
    .kpi-card__label { font-size: 13px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .main-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
    }

    .left-column { display: flex; flex-direction: column; gap: 24px; }
    .right-column { display: flex; flex-direction: column; gap: 24px; }

    .chart-card, .dept-card, .list-card {
      padding: 20px !important;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .card-header h2 { font-size: 15px; font-weight: 600; margin: 0; color: var(--color-text-primary); }

    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: var(--color-surface-alt);
      color: var(--color-text-secondary);
      font-weight: 600;
    }

    .chart-wrapper { height: 320px; }

    .dept-list { display: flex; flex-direction: column; gap: 12px; }
    .dept-row { display: flex; align-items: center; gap: 12px; }
    .dept-name {
      width: 120px;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dept-progress { flex: 1; display: flex; align-items: center; gap: 10px; }
    .dept-progress ::ng-deep .mat-mdc-progress-bar { height: 8px; border-radius: 4px; }
    .dept-value { font-size: 12px; font-weight: 600; color: var(--color-text-primary); width: 40px; text-align: right; }

    .employee-list { display: flex; flex-direction: column; gap: 8px; }
    .employee-item { border-bottom: 1px solid var(--color-border-light); }
    .employee-item:last-child { border-bottom: none; }
    .employee-link {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; text-decoration: none; color: var(--color-text-primary);
      transition: color var(--transition-fast);
    }
    .employee-link:hover { color: var(--color-primary); }
    .employee-name { font-size: 13.5px; font-weight: 500; }
    .employee-score { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .employee-score.good { background: rgba(22, 163, 74, 0.12); color: #16A34A; }
    .employee-score.mid { background: rgba(217, 119, 6, 0.14); color: #D97706; }
    .employee-score.bad { background: rgba(220, 38, 38, 0.12); color: #DC2626; }

    .empty-state-wrapper { padding: 60px 20px; }
    .empty-small {
      padding: 24px; text-align: center;
      color: var(--color-text-muted); font-size: 13px;
    }

    @media (max-width: 1100px) {
      .main-grid { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class PerformanceDashboardComponent implements OnInit {
  private service = inject(PerformanceService);
  private router = inject(Router);
  readonly auth = inject(AuthService);

  loading = signal(true);
  stats = signal<PerformanceStats | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.service.getStats().pipe(catchError(() => of(null)))
      .subscribe(stats => { this.stats.set(stats); this.loading.set(false); });
  }

  kpis(s: PerformanceStats): KpiCard[] {
    return [
      { label: 'Company Average', value: this.round(s.companyAverageScore).toString(), icon: 'insights', color: '#1B3A6B' },
      { label: 'Completed Reviews', value: s.completedReviews.toString(), icon: 'task_alt', color: '#16A34A' },
      { label: 'Pending Reviews', value: s.pendingReviews.toString(), icon: 'pending_actions', color: '#D97706' },
    ];
  }

  scoreClass(score?: number): string {
    if ((score ?? 0) >= 75) return 'good';
    if ((score ?? 0) >= 50) return 'mid';
    return 'bad';
  }

  scoreColor(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= 75) return 'primary';
    if (score >= 50) return 'accent';
    return 'warn';
  }

  round(value?: number): number {
    return Math.round((value ?? 0) * 10) / 10;
  }

  openCreate(): void {
    this.router.navigate(['/rh/performance/reviews'], { queryParams: { new: '1' } });
  }
}