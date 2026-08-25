import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { Project, ProjectStatus, ProjectPriority } from '../../../domain/models/project.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import {
  ProjectFormDialogComponent,
  ProjectDialogData,
} from '../project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressBarModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
    StatusChipComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Projects</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> New Project
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <form class="search-bar" [formGroup]="filterForm">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search by name</mat-label>
            <input matInput formControlName="name" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All</mat-option>
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{ s.replace('_', ' ') }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="">All</mat-option>
              @for (p of priorities; track p) {
                <mat-option [value]="p">{{ p }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>

        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="folder_open" title="No projects" message="Create a project to get started." />
        } @else {
          <table mat-table [dataSource]="dataSource" class="w-full">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Project</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/projects', row.id]" class="link">{{ row.name }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.status"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.priority" type="priority"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>Progress</th>
              <td mat-cell *matCellDef="let row">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="row.progress"></mat-progress-bar>
                  <span>{{ row.progress }}%</span>
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="endDate">
              <th mat-header-cell *matHeaderCellDef>Deadline</th>
              <td mat-cell *matCellDef="let row">{{ row.endDate }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/projects', row.id]">
                    <mat-icon>visibility</mat-icon> View
                  </button>
                  <button mat-menu-item (click)="openDialog(row)">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-menu-item (click)="delete(row)">
                    <mat-icon color="warn">delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    .progress-cell {
      display: flex; align-items: center; gap: 8px; min-width: 120px;
      mat-progress-bar { flex: 1; }
      span { font-size: 12px; color: var(--color-text-secondary); }
    }
  `],
})
export class ProjectListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private service = inject(ProjectService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = signal(true);
  dataSource = new MatTableDataSource<Project>([]);
  columns = ['name', 'status', 'priority', 'progress', 'endDate', 'actions'];
  statuses: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  priorities: ProjectPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  filterForm = this.fb.nonNullable.group({
    name: [''],
    status: [''],
    priority: [''],
  });

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load());
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  load(): void {
    this.loading.set(true);
    const f = this.filterForm.getRawValue();
    this.service
      .getAll({
        name: f.name || undefined,
        status: f.status || undefined,
        priority: f.priority || undefined,
      })
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.loading.set(false);
      });
  }

  openDialog(project?: Project): void {
    this.dialog
      .open(ProjectFormDialogComponent, {
        width: '520px',
        data: { project } satisfies ProjectDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          project ? this.service.update(project.id, form) : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(project ? 'Project updated' : 'Project created', 'OK', {
            duration: 3000,
          });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(project: Project): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Project',
          message: `Delete "${project.name}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(project.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Project deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
