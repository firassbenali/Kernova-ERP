import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
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
import { catchError, filter, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ResourcePlanningService } from '../../../../core/services/resource-planning.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { ProjectService } from '../../../../core/services/project.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Employee } from '../../../../domain/models/employee.model';
import { Project } from '../../../../domain/models/project.model';
import { PageResponse, ResourceAllocation, WorkloadStatus } from '../../../../domain/models/resource-planning.model';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import {
  ResourceAllocationFormDialogComponent,
  ResourceAllocationDialogData,
} from '../resource-allocation-form-dialog/resource-allocation-form-dialog.component';

@Component({
  selector: 'app-resource-allocation-list',
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
        <h1>Resource Allocations</h1>
        @if (auth.isAdmin()) {
          <div class="page-header-actions">
            <button mat-flat-button color="primary" (click)="openDialog()">
              <mat-icon>add</mat-icon> New Allocation
            </button>
          </div>
        }
      </div>

      <div class="section-card filters-bar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter filter--search">
          <mat-label>Search</mat-label>
          <input matInput [value]="search()" (input)="onSearch($event)" placeholder="Employee, project, role..." />
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter">
          <mat-label>Workload</mat-label>
          <mat-select [value]="workloadStatus() || null" (selectionChange)="onWorkloadStatusChange($event)">
            <mat-option>All workloads</mat-option>
            @for (status of workloadStatusOptions; track status) {
              <mat-option [value]="status">{{ formatStatus(status) }}</mat-option>
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
          <mat-label>Project</mat-label>
          <mat-select (selectionChange)="onFilterChange('projectId', $event.value)">
            <mat-option>All projects</mat-option>
            @for (project of projects(); track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
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
            icon="engineering"
            title="No allocations found"
            message="No resource allocations match the current filters."
          />
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Employee</th>
              <td mat-cell *matCellDef="let row">
                <a class="link" [routerLink]="['/rh/resource-planning/employees', row.employeeId, 'workload']">{{ row.employeeName }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="projectName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Project</th>
              <td mat-cell *matCellDef="let row">
                <a class="link" [routerLink]="['/rh/resource-planning/projects', row.projectId, 'allocation']">{{ row.projectName }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="allocationPercentage">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Allocation</th>
              <td mat-cell *matCellDef="let row">
                <span class="allocation-badge" [ngClass]="allocationClass(row.allocationPercentage)">{{ row.allocationPercentage }}%</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Period</th>
              <td mat-cell *matCellDef="let row">{{ row.startDate | date: 'MMM d, y' }} → {{ row.endDate | date: 'MMM d, y' }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let row">{{ row.role || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row"><app-status-chip [status]="row.status"></app-status-chip></td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="More actions">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  @if (auth.isAdmin()) {
                    <button mat-menu-item (click)="openDialog(row)">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-menu-item [disabled]="row.status !== 'ACTIVE'" (click)="deleteAllocation(row)">
                      <mat-icon color="warn">delete</mat-icon> Delete
                    </button>
                  }
                </mat-menu>
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

      .allocation-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-weight: 700;
        font-size: 12.5px;
      }
      .allocation-low { background: rgba(22, 163, 74, 0.12); color: #16A34A; }
      .allocation-mid { background: rgba(217, 119, 6, 0.14); color: #D97706; }
      .allocation-high { background: rgba(220, 38, 38, 0.12); color: #DC2626; }
    `,
  ],
})
export class ResourceAllocationListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private service = inject(ResourcePlanningService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  loading = signal(true);
  pageIndex = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);

  search = signal('');
  workloadStatus = signal<WorkloadStatus | ''>('');
  departmentId?: number;
  projectId?: number;

  employees = signal<Employee[]>([]);
  departments = signal<any[]>([]);
  projects = signal<Project[]>([]);

  dataSource = new MatTableDataSource<ResourceAllocation>([]);
  columns = ['employeeName', 'projectName', 'allocationPercentage', 'period', 'role', 'status', 'actions'];
  readonly workloadStatusOptions: WorkloadStatus[] = ['AVAILABLE', 'UNDERUTILIZED', 'OPTIMAL', 'HIGH', 'OVERALLOCATED'];

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
      this.projectService.getAll().pipe(catchError(() => of([]))),
    ]).subscribe(([employees, projects]) => {
      this.employees.set(employees as Employee[]);
      this.projects.set(projects as Project[]);
      // Extract unique departments from employees
      const deptMap = new Map<number, { id: number; name: string }>();
      employees.forEach(e => {
        if (e.departmentId && e.departmentName) {
          deptMap.set(e.departmentId, { id: e.departmentId, name: e.departmentName });
        }
      });
      this.departments.set(Array.from(deptMap.values()));
    });
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getAllocations({
        page: this.pageIndex() + 1,
        size: this.pageSize(),
        workloadStatus: this.workloadStatus() || undefined,
        departmentId: this.departmentId,
        projectId: this.projectId,
      })
      .pipe(
        catchError(() =>
          of({ content: [], page: 1, size: this.pageSize(), totalElements: 0, totalPages: 0 } satisfies PageResponse<ResourceAllocation>)
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
      data.projectName.toLowerCase().includes(filterValue) ||
      (data.role ?? '').toLowerCase().includes(filterValue);
    this.dataSource.filter = term;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.trim().toLowerCase());
    this.applySearch();
  }

  onWorkloadStatusChange(event: { value?: WorkloadStatus | null }): void {
    this.workloadStatus.set(event.value ?? '');
    this.reloadFromFirstPage();
  }

  onFilterChange(key: 'departmentId' | 'projectId', value?: number | null): void {
    if (key === 'departmentId') this.departmentId = value ?? undefined;
    if (key === 'projectId') this.projectId = value ?? undefined;
    this.reloadFromFirstPage();
  }

  resetFilters(): void {
    this.search.set('');
    this.workloadStatus.set('');
    this.departmentId = undefined;
    this.projectId = undefined;
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

  openDialog(allocation?: ResourceAllocation): void {
    this.dialog
      .open(ResourceAllocationFormDialogComponent, {
        width: '640px',
        data: { allocation, employees: this.employees(), projects: this.projects() } satisfies ResourceAllocationDialogData,
      })
      .afterClosed()
      .pipe(
        filter((result): result is { request: any; isEdit: boolean } => !!result),
        tap(({ isEdit }) => (editing = isEdit)),
        switchMap(({ request, isEdit }) =>
          isEdit
            ? this.service.updateAllocation(allocation!.id, request)
            : this.service.createAllocation(request)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(editing ? 'Allocation updated' : 'Allocation created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  deleteAllocation(allocation: ResourceAllocation): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Allocation',
          message: `Delete allocation for ${allocation.employeeName} on ${allocation.projectName}?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.deleteAllocation(allocation.id)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Allocation deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }

  allocationClass(percentage: number): string {
    if (percentage <= 50) return 'allocation-low';
    if (percentage <= 80) return 'allocation-mid';
    return 'allocation-high';
  }

  formatStatus(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

let editing = false;