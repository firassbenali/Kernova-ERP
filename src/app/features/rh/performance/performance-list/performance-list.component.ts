import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { catchError, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { PerformanceService } from '../../../../core/services/performance.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { PositionService } from '../../../../core/services/position.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Employee } from '../../../../domain/models/employee.model';
import { Department } from '../../../../domain/models/department.model';
import { Position } from '../../../../domain/models/position.model';
import {
  CreatePerformanceReviewRequest,
  PageResponse,
  PerformanceReview,
  PerformanceStatus,
  UpdatePerformanceReviewRequest,
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

const STATUSES: PerformanceStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'];

@Component({
  selector: 'app-performance-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    StatusChipComponent,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Performance Reviews</h1>
        @if (auth.isAdmin()) {
          <div class="page-header-actions">
            <button mat-flat-button color="primary" (click)="openDialog()">
              <mat-icon>add</mat-icon> New Review
            </button>
          </div>
        }
      </div>

      <div class="section-card filters-bar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter filter--search">
          <mat-label>Search</mat-label>
          <input matInput [value]="search()" (input)="onSearch($event)" placeholder="Employee or period..." />
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-label>Status</mat-label>
          <mat-select [value]="status() || null" (selectionChange)="onStatusChange($event)">
            <mat-option>All statuses</mat-option>
            @for (status of statusOptions; track status) {
              <mat-option [value]="status">{{ labelize(status) }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-label>Department</mat-label>
          <mat-select (selectionChange)="onFilterChange('departmentId', $event.value)">
            <mat-option>All departments</mat-option>
            @for (dept of departments(); track dept.id) {
              <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-label>Position</mat-label>
          <mat-select (selectionChange)="onFilterChange('positionId', $event.value)">
            <mat-option>All positions</mat-option>
            @for (position of positions(); track position.id) {
              <mat-option [value]="position.id">{{ position.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-label>Reviewer</mat-label>
          <mat-select (selectionChange)="onFilterChange('reviewerId', $event.value)">
            <mat-option>All reviewers</mat-option>
            @for (employee of employees(); track employee.id) {
              <mat-option [value]="employee.id">{{ employee.username }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button mat-button (click)="resetFilters()">
          <mat-icon>filter_alt_off</mat-icon> Reset
        </button>
      </div>

      <div class="section-card table-card">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && totalElements() === 0 && dataSource.data.length === 0) {
          <app-empty-state
            icon="fact_check"
            title="No reviews found"
            message="No performance reviews match the current filters."
          />
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Employee</th>
              <td mat-cell *matCellDef="let row">
                <a class="link" [routerLink]="['/rh/performance', row.id]">{{ row.employeeName }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="reviewPeriod">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Period</th>
              <td mat-cell *matCellDef="let row">{{ row.reviewPeriod }}</td>
            </ng-container>
            <ng-container matColumnDef="reviewDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
              <td mat-cell *matCellDef="let row">{{ row.reviewDate | date: 'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row"><app-status-chip [status]="row.status"></app-status-chip></td>
            </ng-container>
            <ng-container matColumnDef="overallScore">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Score</th>
              <td mat-cell *matCellDef="let row">
                @if (row.overallScore != null) {
                  <span class="score" [ngClass]="scoreClass(row.overallScore)">{{ row.overallScore }}</span>
                } @else {
                  <span class="score score--none">—</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="reviewerName">
              <th mat-header-cell *matHeaderCellDef>Reviewer</th>
              <td mat-cell *matCellDef="let row">{{ row.reviewerName || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button routerLink="/rh/performance/{{ row.id }}" aria-label="View review">
                  <mat-icon>visibility</mat-icon>
                </button>
                @if (auth.isAdmin()) {
                  <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="More actions">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [disabled]="!isEditable(row)" (click)="openDialog(row)">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-menu-item [disabled]="row.status === 'COMPLETED' || row.status === 'APPROVED'" (click)="submit(row)">
                      <mat-icon>send</mat-icon> Submit
                    </button>
                    <button mat-menu-item [disabled]="row.status !== 'COMPLETED'" (click)="approve(row)">
                      <mat-icon>verified</mat-icon> Approve
                    </button>
                    <button mat-menu-item [disabled]="row.status === 'APPROVED'" (click)="deleteReview(row)">
                      <mat-icon color="warn">delete</mat-icon> Delete
                    </button>
                  </mat-menu>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>

          <mat-paginator
            [length]="totalElements()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .filters-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        padding: 14px 16px;
        margin-bottom: 20px;
      }
      .filter { width: 160px; font-size: 13px; }
      .filter--search { width: 220px; flex: 1 1 200px; max-width: 320px; }

      .table-card { position: relative; overflow: hidden; }
      .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
      .link:hover { text-decoration: underline; }

      .score { font-weight: 700; font-size: 13.5px; }
      .score-good { color: #16A34A; }
      .score-mid { color: #D97706; }
      .score-bad { color: #DC2626; }
      .score--none { color: var(--color-text-muted); font-weight: 400; }
    `,
  ],
})
export class PerformanceListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private service = inject(PerformanceService);
  private employeeService = inject(EmployeeService);
  private departmentService = inject(DepartmentService);
  private positionService = inject(PositionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  loading = signal(true);
  pageIndex = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);

  search = signal('');
  status = signal<PerformanceStatus | ''>('');
  departmentId?: number;
  positionId?: number;
  reviewerId?: number;

  employees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  positions = signal<Position[]>([]);

  dataSource = new MatTableDataSource<PerformanceReview>([]);
  columns = ['employeeName', 'reviewPeriod', 'reviewDate', 'status', 'overallScore', 'reviewerName', 'actions'];
  readonly statusOptions = STATUSES;

  ngOnInit(): void {
    this.loadLookups();
    this.load();
    this.route.queryParamMap
      .pipe(map(params => params.get('new') === '1'), filter(isNew => isNew))
      .subscribe(() => this.openDialog());
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  private loadLookups(): void {
    forkJoin([
      this.employeeService.getAll().pipe(catchError(() => of([]))),
      this.departmentService.getAll().pipe(catchError(() => of([]))),
      this.positionService.getAll().pipe(catchError(() => of([]))),
    ]).subscribe(([employees, departments, positions]) => {
      this.employees.set(employees as Employee[]);
      this.departments.set(departments as Department[]);
      this.positions.set(positions as Position[]);
    });
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getReviews({
        page: this.pageIndex() + 1,
        size: this.pageSize(),
        status: this.status() || undefined,
        departmentId: this.departmentId,
        positionId: this.positionId,
        reviewerId: this.reviewerId,
      })
      .pipe(
        catchError(() =>
          of({ content: [], page: 1, size: this.pageSize(), totalElements: 0, totalPages: 0 } satisfies PageResponse<PerformanceReview>)
        )
      )
      .subscribe(page => {
        this.dataSource.data = page.content ?? [];
        this.totalElements.set(page.totalElements ?? 0);
        this.applySearch();
        this.loading.set(false);
      });
  }

  applySearch(): void {
    const term = this.search().toLowerCase();
    this.dataSource.filterPredicate = (data, filterValue) =>
      !filterValue ||
      (data.employeeName ?? '').toLowerCase().includes(filterValue) ||
      data.reviewPeriod.toLowerCase().includes(filterValue);
    this.dataSource.filter = term;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.trim().toLowerCase());
    this.applySearch();
  }

  onStatusChange(event: { value?: PerformanceStatus | null }): void {
    this.status.set(event.value ?? '');
    this.reloadFromFirstPage();
  }

  onFilterChange(key: 'departmentId' | 'positionId' | 'reviewerId', value?: number | null): void {
    if (key === 'departmentId') this.departmentId = value ?? undefined;
    if (key === 'positionId') this.positionId = value ?? undefined;
    if (key === 'reviewerId') this.reviewerId = value ?? undefined;
    this.reloadFromFirstPage();
  }

  resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.departmentId = undefined;
    this.positionId = undefined;
    this.reviewerId = undefined;
    this.reloadFromFirstPage();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private reloadFromFirstPage(): void {
    this.pageIndex.set(0);
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.load();
  }

  isEditable(review: PerformanceReview): boolean {
    return review.status === 'DRAFT' || review.status === 'IN_PROGRESS';
  }

  openDialog(review?: PerformanceReview): void {
    let editing = false;
    this.dialog
      .open(PerformanceFormDialogComponent, {
        width: '720px',
        data: { review, employees: this.employees(), criteria$: this.service.getCriteria(true) } satisfies PerformanceDialogData,
      })
      .afterClosed()
      .pipe(
        filter((result): result is PerformanceDialogResult => !!result),
        tap(({ review: existing }) => (editing = !!existing)),
        switchMap(({ review: existing, request }) =>
          existing ? this.service.updateReview(existing.id, request as UpdatePerformanceReviewRequest) : this.service.createReview(request as CreatePerformanceReviewRequest)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(editing ? 'Review updated' : 'Review created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  submit(review: PerformanceReview): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Submit Review',
          message: `Submit the ${review.reviewPeriod} review for ${review.employeeName}? It will be marked COMPLETED.`,
          confirmLabel: 'Submit',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.submitReview(review.id)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review submitted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Submit failed', 'Dismiss', { duration: 4000 }),
      });
  }

  approve(review: PerformanceReview): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Approve Review',
          message: `Approve the ${review.reviewPeriod} review for ${review.employeeName}?`,
          confirmLabel: 'Approve',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.approveReview(review.id)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review approved', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Approval failed', 'Dismiss', { duration: 4000 }),
      });
  }

  deleteReview(review: PerformanceReview): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Review',
          message: `Delete the ${review.reviewPeriod} review for ${review.employeeName}?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.deleteReview(review.id)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Review deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }

  scoreClass(score?: number): string {
    if ((score ?? 0) >= 75) return 'score-good';
    if ((score ?? 0) >= 50) return 'score-mid';
    return 'score-bad';
  }

  labelize(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
