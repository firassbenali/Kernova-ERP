import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { catchError, filter, forkJoin, of, switchMap } from 'rxjs';
import { PerformanceService } from '../../../../core/services/performance.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Employee } from '../../../../domain/models/employee.model';
import {
  PerformanceCriterion,
  PerformanceEvaluation,
  PerformanceReview,
} from '../../../../domain/models/performance.model';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import {
  PerformanceFormDialogComponent,
  PerformanceDialogData,
  PerformanceDialogResult,
} from '../performance-form-dialog/performance-form-dialog.component';

@Component({
  selector: 'app-performance-detail',
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
            <h1>{{ review()?.employeeName ?? 'Review' }}</h1>
            @if (review(); as r) {
              <p class="subtitle">{{ r.reviewPeriod }} · {{ r.reviewDate | date: 'mediumDate' }}</p>
            }
          </div>
        </div>
        @if (auth.isAdmin() && review(); as r) {
          <div class="page-header-actions">
            @if (isEditable(r)) {
              <button mat-stroked-button (click)="edit()">
                <mat-icon>edit</mat-icon> Edit
              </button>
            }
            @if (r.status === 'DRAFT' || r.status === 'IN_PROGRESS') {
              <button mat-flat-button color="primary" (click)="submit()">
                <mat-icon>send</mat-icon> Submit
              </button>
            }
            @if (r.status === 'COMPLETED') {
              <button mat-flat-button color="primary" (click)="approve()">
                <mat-icon>verified</mat-icon> Approve
              </button>
            }
            @if (r.status !== 'APPROVED') {
              <button mat-stroked-button color="warn" (click)="delete()">
                <mat-icon>delete</mat-icon> Delete
              </button>
            }
          </div>
        }
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && !review()) {
          <app-empty-state icon="fact_check" title="Review not found" message="This performance review does not exist or you cannot access it." />
        }

        @if (review(); as r) {
          <mat-card class="summary-card">
            <div class="score-block" [ngClass]="scoreClass(r.overallScore)">
              <span class="score-value">{{ r.overallScore != null ? r.overallScore : '—' }}</span>
              <span class="score-label">Overall Score</span>
            </div>
            <div class="meta-grid">
              <div><span class="label">Status</span><app-status-chip [status]="r.status"></app-status-chip></div>
              <div><span class="label">Employee</span><a [routerLink]="['/rh/employees', r.employeeId]">{{ r.employeeName }}</a></div>
              <div><span class="label">Reviewer</span><span>{{ r.reviewerName || '—' }}</span></div>
              <div><span class="label">Created</span><span>{{ r.createdAt | date: 'mediumDate' }}</span></div>
              <div class="full"><span class="label">Comments</span><span>{{ r.comments || '—' }}</span></div>
              <div><span class="label">Strengths</span><span>{{ r.strengths || '—' }}</span></div>
              <div><span class="label">Improvement Areas</span><span>{{ r.improvementAreas || '—' }}</span></div>
            </div>
          </mat-card>

          <mat-card class="evaluations-card">
            <h2>Evaluations</h2>
            @if ((r.evaluations ?? []).length === 0) {
              <p class="empty-msg">No evaluations recorded yet.</p>
            } @else {
              <table mat-table [dataSource]="evaluations()" class="w-full">
                <ng-container matColumnDef="criterionName">
                  <th mat-header-cell *matHeaderCellDef>Criterion</th>
                  <td mat-cell *matCellDef="let row">{{ row.criterionName }} {{ criterionWeight(row.criterionId) !== null ? '(weight ' + criterionWeight(row.criterionId) + ')' : '' }}</td>
                </ng-container>
                <ng-container matColumnDef="score">
                  <th mat-header-cell *matHeaderCellDef>Score</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="pill" [ngClass]="scoreClass(row.score)">{{ row.score }}/100</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="comment">
                  <th mat-header-cell *matHeaderCellDef>Comment</th>
                  <td mat-cell *matCellDef="let row">{{ row.comment || '—' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns"></tr>
              </table>
            }
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .subtitle { margin: 0; color: var(--color-text-muted); font-size: 13px; }

      .summary-card {
        display: flex;
        gap: 28px;
        padding: 24px !important;
        margin-bottom: 24px;
        align-items: flex-start;
      }
      .score-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 120px;
        padding: 18px 20px;
        border-radius: 12px;
        background: rgba(22, 163, 74, 0.1);
        color: #16A34A;
      }
      .score-mid { background: rgba(217, 119, 6, 0.12) !important; color: #D97706; }
      .score-bad { background: rgba(220, 38, 38, 0.1) !important; color: #DC2626; }
      .score-value { font-size: 32px; font-weight: 700; line-height: 1.1; }
      .score-label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.85; }

      .meta-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px 20px;
      }
      .meta-grid > div { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
      .meta-grid .full { grid-column: 1 / -1; }
      .label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }

      .evaluations-card { padding: 24px !important; }
      .evaluations-card h2 { font-size: 16px; margin: 0 0 16px; }
      .empty-msg { color: var(--color-text-muted); margin: 0; }
      a { color: var(--color-primary); text-decoration: none; }
      a:hover { text-decoration: underline; }

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
    `,
  ],
})
export class PerformanceDetailComponent implements OnInit {
  private service = inject(PerformanceService);
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  readonly auth = inject(AuthService);

  loading = signal(true);
  review = signal<PerformanceReview | null>(null);
  criteria = signal<PerformanceCriterion[]>([]);
  evaluations = signal<PerformanceEvaluation[]>([]);

  columns = ['criterionName', 'score', 'comment'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.loading.set(false);
      return;
    }
    this.load(id);
  }

  load(id: number): void {
    this.loading.set(true);
    this.service
      .getReviewById(id)
      .pipe(
        catchError(() => of(null)),
        switchMap(review => {
          if (!review) return of({ review: null, criteria: [] as PerformanceCriterion[] });
          return forkJoin({
            review: of(review),
            criteria: this.service.getCriteria().pipe(catchError(() => of([] as PerformanceCriterion[]))),
          });
        })
      )
      .subscribe(({ review, criteria }) => {
        this.review.set(review);
        if (review) {
          this.evaluations.set(review.evaluations ?? []);
        }
        this.criteria.set(criteria);
        this.loading.set(false);
      });
  }

  isEditable(review: PerformanceReview): boolean {
    return review.status === 'DRAFT' || review.status === 'IN_PROGRESS';
  }

  criterionWeight(criterionId: number): number | null {
    return this.criteria().find(criterion => criterion.id === criterionId)?.weight ?? null;
  }

  edit(): void {
    const current = this.review();
    if (!current) return;
    this.employeeService
      .getAll()
      .pipe(catchError(() => of([] as Employee[])))
      .subscribe(employees => {
        this.dialog
          .open(PerformanceFormDialogComponent, {
            width: '720px',
            data: {
              review: current,
              employees,
              criteria$: this.service.getCriteria(true),
            } satisfies PerformanceDialogData,
          })
          .afterClosed()
          .pipe(
            filter((result): result is PerformanceDialogResult => !!result),
            switchMap(({ request }) =>
              this.service.updateReview(current.id, request as Parameters<typeof this.service.updateReview>[1])
            )
          )
          .subscribe({
            next: () => {
              this.snackBar.open('Review updated', 'OK', { duration: 3000 });
              this.load(current.id);
            },
            error: () => this.snackBar.open('Update failed', 'Dismiss', { duration: 4000 }),
          });
      });
  }

  submit(): void {
    const current = this.review();
    if (!current) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Submit Review',
          message: `Submit this ${current.reviewPeriod} review? It will be marked COMPLETED and locked for edits.`,
          confirmLabel: 'Submit',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.submitReview(current.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review submitted', 'OK', { duration: 3000 });
          this.load(current.id);
        },
        error: () => this.snackBar.open('Submit failed', 'Dismiss', { duration: 4000 }),
      });
  }

  approve(): void {
    const current = this.review();
    if (!current) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve Review',
          message: `Approve this ${current.reviewPeriod} review for ${current.employeeName}?`,
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.approveReview(current.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review approved', 'OK', { duration: 3000 });
          this.load(current.id);
        },
        error: () => this.snackBar.open('Approval failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(): void {
    const current = this.review();
    if (!current) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Review',
          message: `Delete this ${current.reviewPeriod} review for ${current.employeeName}?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.deleteReview(current.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review deleted', 'OK', { duration: 3000 });
          this.router.navigate(['/rh/performance/reviews']);
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }

  scoreClass(score?: number | null): string {
    if ((score ?? 0) >= 75) return '';
    if ((score ?? 0) >= 50) return 'score-mid';
    return 'score-bad';
  }
}
