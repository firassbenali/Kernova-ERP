import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { PerformanceService } from '../../../../core/services/performance.service';
import {
  EmployeePerformanceSummary,
} from '../../../../domain/models/performance.model';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-employee-performance',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    StatusChipComponent,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/rh/performance/reviews"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1>{{ summary()?.employeeName ?? 'Employee' }}</h1>
            @if (summary(); as s) {
              <p class="subtitle">
                {{ [s.positionTitle, s.departmentName].filter(part => !!part).join(' · ') || 'Performance history' }}
              </p>
            }
          </div>
        </div>
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && !summary()) {
          <app-empty-state
            icon="insights"
            title="No performance data"
            message="There is no completed performance data for this employee yet."
          />
        }

        @if (summary(); as s) {
          @if (s.reviewCount === 0) {
            <app-empty-state
              icon="insights"
              title="No completed reviews"
              message="Completed or approved reviews will appear here once available."
            />
          } @else {
            <div class="kpis">
              <div class="section-card kpi">
                <span class="kpi__label">Average Score</span>
                <span class="kpi__value" [ngClass]="scoreClass(s.averageScore)">{{ s.averageScore ?? '—' }}</span>
              </div>
              <div class="section-card kpi">
                <span class="kpi__label">Latest Score</span>
                <span class="kpi__value" [ngClass]="scoreClass(s.lastScore)">{{ s.lastScore ?? '—' }}</span>
              </div>
              <div class="section-card kpi">
                <span class="kpi__label">Reviews</span>
                <span class="kpi__value">{{ s.reviewCount }}</span>
              </div>
            </div>

            @if (s.criterionBreakdown.length > 0) {
              <mat-card class="breakdown-card">
                <h2>Criterion Breakdown</h2>
                @for (item of s.criterionBreakdown; track item.criterionId) {
                  <div class="breakdown-row">
                    <span class="breakdown-row__name">{{ item.criterionName }}</span>
                    <div class="bar">
                      <div class="bar__fill" [ngClass]="scoreClass(item.averageScore)" [style.width.%]="item.averageScore"></div>
                    </div>
                    <span class="breakdown-row__value">{{ item.averageScore }}</span>
                  </div>
                }
              </mat-card>
            }

            <mat-card class="history-card">
              <h2>Review History</h2>
              <table mat-table [dataSource]="s.reviews" class="w-full">
                <ng-container matColumnDef="reviewPeriod">
                  <th mat-header-cell *matHeaderCellDef>Period</th>
                  <td mat-cell *matCellDef="let row">{{ row.reviewPeriod }}</td>
                </ng-container>
                <ng-container matColumnDef="reviewDate">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let row">{{ row.reviewDate | date: 'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row"><app-status-chip [status]="row.status"></app-status-chip></td>
                </ng-container>
                <ng-container matColumnDef="overallScore">
                  <th mat-header-cell *matHeaderCellDef>Score</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="pill" [ngClass]="scoreClass(row.overallScore)">{{ row.overallScore ?? '—' }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button routerLink="/rh/performance/{{ row.id }}" aria-label="View review">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            </mat-card>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .subtitle { margin: 0; color: var(--color-text-muted); font-size: 13px; }

      .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
      .kpi { display: flex; flex-direction: column; gap: 6px; padding: 18px 20px !important; }
      .kpi__label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
      .kpi__value { font-size: 28px; font-weight: 700; line-height: 1.1; }

      .breakdown-card, .history-card { padding: 24px !important; margin-bottom: 24px; }
      h2 { font-size: 16px; margin: 0 0 16px; }

      .breakdown-row { display: grid; grid-template-columns: 200px 1fr 48px; gap: 14px; align-items: center; margin-bottom: 12px; }
      .breakdown-row:last-child { margin-bottom: 0; }
      .breakdown-row__name { font-size: 13.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .breakdown-row__value { text-align: right; font-weight: 600; font-size: 13.5px; }

      .bar { height: 10px; border-radius: 999px; background: rgba(127, 127, 127, 0.15); overflow: hidden; }
      .bar__fill { height: 100%; border-radius: 999px; background-color: #16A34A; transition: width 0.3s ease; }
      .bar__fill.score-mid { background-color: #D97706; }
      .bar__fill.score-bad { background-color: #DC2626; }

      .pill {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12.5px;
        background: rgba(22, 163, 74, 0.12);
        color: #16A34A;
      }
      .pill.score-mid { background: rgba(217, 119, 6, 0.14); color: #D97706; }
      .pill.score-bad { background: rgba(220, 38, 38, 0.12); color: #DC2626; }
      a { color: inherit; }
    `,
  ],
})
export class EmployeePerformanceComponent implements OnInit {
  private service = inject(PerformanceService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  summary = signal<EmployeePerformanceSummary | null>(null);

  columns = ['reviewPeriod', 'reviewDate', 'status', 'overallScore', 'actions'];

  ngOnInit(): void {
    const employeeId = Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(employeeId)) {
      this.loading.set(false);
      return;
    }
    this.service
      .getEmployeePerformance(employeeId)
      .pipe(catchError(() => of(null)))
      .subscribe(summary => {
        this.summary.set(summary);
        this.loading.set(false);
      });
  }

  scoreClass(score?: number | null): string {
    if ((score ?? 0) >= 75) return '';
    if ((score ?? 0) >= 50) return 'score-mid';
    return 'score-bad';
  }
}
