import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../domain/models/task.model';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  TaskFormDialogComponent,
  TaskDialogData,
} from '../task-form-dialog/task-form-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    StatusChipComponent,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          @if (projectId) {
            <a mat-icon-button routerLink="/projects"><mat-icon>arrow_back</mat-icon></a>
          }
          <h1>{{ projectId ? 'Project Tasks' : 'Tasks' }}</h1>
        </div>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> New Task
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="task_alt" title="No tasks" message="Create a task to get started." />
        } @else {
          <table mat-table [dataSource]="dataSource" class="w-full">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Task</th>
              <td mat-cell *matCellDef="let row">{{ row.title }}</td>
            </ng-container>
            <ng-container matColumnDef="projectName">
              <th mat-header-cell *matHeaderCellDef>Project</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/projects', row.projectId]" class="link">{{ row.projectName }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="employeeName">
              <th mat-header-cell *matHeaderCellDef>Assignee</th>
              <td mat-cell *matCellDef="let row">{{ row.employeeName }}</td>
            </ng-container>
            <ng-container matColumnDef="priority">
              <th mat-header-cell *matHeaderCellDef>Priority</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.priority" type="priority"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.status"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="deadline">
              <th mat-header-cell *matHeaderCellDef>Deadline</th>
              <td mat-cell *matCellDef="let row">{{ row.deadline }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
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
        }
      </div>
    </div>
  `,
  styles: [`
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
  `],
})
export class TaskListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(TaskService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<Task>([]);
  columns = ['title', 'projectName', 'employeeName', 'priority', 'status', 'deadline', 'actions'];
  projectId: number | null = null;

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    this.projectId = param ? Number(param) : null;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const request = this.projectId
      ? this.service.getByProject(this.projectId)
      : this.service.getAll();
    request
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.loading.set(false);
      });
  }

  openDialog(task?: Task): void {
    this.dialog
      .open(TaskFormDialogComponent, {
        width: '520px',
        data: { task, projectId: this.projectId ?? undefined } satisfies TaskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          task ? this.service.update(task.id, form) : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(task ? 'Task updated' : 'Task created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(task: Task): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Task',
          message: `Delete "${task.title}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(task.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Task deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
