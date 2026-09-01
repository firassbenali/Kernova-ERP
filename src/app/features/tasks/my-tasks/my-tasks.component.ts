import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/auth/auth.service';

import { Task, TaskStatus } from '../../../domain/models/task.model';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    StatusChipComponent,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Mes Tâches (My Tasks)</h1>
          <span class="sub-text">Consultez et mettez à jour les tâches qui vous sont assignées</span>
        </div>
        <div class="page-header-actions">
          <a mat-stroked-button routerLink="/tasks">
            <mat-icon>list</mat-icon> Toutes les Tâches
          </a>
        </div>
      </div>

      <app-loading-overlay [loading]="loading()"></app-loading-overlay>

      @if (!loading()) {
        @if (tasks().length === 0) {
          <app-empty-state
            icon="task_alt"
            title="Aucune tâche assignée"
            message="Vous n'avez actuellement aucune tâche en cours ou à faire."
          />
        } @else {
          <!-- Quick Status Summary KPI Cards -->
          <div class="kpi-grid mb-6">
            <div class="kpi-card" (click)="filterStatus = 'ALL'" [class.active]="filterStatus === 'ALL'">
              <div class="kpi-icon kpi-blue"><mat-icon>assignment</mat-icon></div>
              <div class="kpi-info">
                <span class="kpi-value">{{ tasks().length }}</span>
                <span class="kpi-label">Total Tâches</span>
              </div>
            </div>

            <div class="kpi-card" (click)="filterStatus = 'TODO'" [class.active]="filterStatus === 'TODO'">
              <div class="kpi-icon kpi-orange"><mat-icon>schedule</mat-icon></div>
              <div class="kpi-info">
                <span class="kpi-value">{{ getCount('TODO') }}</span>
                <span class="kpi-label">À Faire (TODO)</span>
              </div>
            </div>

            <div class="kpi-card" (click)="filterStatus = 'IN_PROGRESS'" [class.active]="filterStatus === 'IN_PROGRESS'">
              <div class="kpi-icon kpi-purple"><mat-icon>pending_actions</mat-icon></div>
              <div class="kpi-info">
                <span class="kpi-value">{{ getCount('IN_PROGRESS') }}</span>
                <span class="kpi-label">En Cours</span>
              </div>
            </div>

            <div class="kpi-card" (click)="filterStatus = 'DONE'" [class.active]="filterStatus === 'DONE'">
              <div class="kpi-icon kpi-green"><mat-icon>check_circle</mat-icon></div>
              <div class="kpi-info">
                <span class="kpi-value">{{ getCount('DONE') }}</span>
                <span class="kpi-label">Terminées</span>
              </div>
            </div>
          </div>

          <!-- Task Cards List -->
          <div class="task-grid">
            @for (task of filteredTasks(); track task.id) {
              <mat-card class="task-card">
                <div class="card-top">
                  <span class="project-tag">
                    <mat-icon inline>folder</mat-icon> {{ task.projectName || 'Projet #' + task.projectId }}
                  </span>
                  <app-status-chip [status]="task.priority" type="priority"></app-status-chip>
                </div>

                <h3 class="task-title">{{ task.title }}</h3>
                <p class="task-desc">{{ task.description || 'Pas de description fournie.' }}</p>

                <div class="card-footer">
                  <div class="task-meta">
                    <span class="deadline"><mat-icon inline>event</mat-icon> Echéance: {{ task.deadline || 'Non définie' }}</span>
                  </div>

                  <div class="status-action">
                    <mat-select
                      [value]="task.status"
                      (selectionChange)="updateTaskStatus(task, $event.value)"
                      class="status-select"
                    >
                      @for (st of statuses; track st) {
                        <mat-option [value]="st">{{ st.replace('_', ' ') }}</mat-option>
                      }
                    </mat-select>
                  </div>
                </div>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .sub-text { font-size: 13px; color: var(--color-text-secondary); }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
      &:hover, &.active {
        border-color: var(--color-primary);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
      }
    }
    .kpi-icon {
      width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .kpi-blue { background: #2563eb; }
    .kpi-orange { background: #ea580c; }
    .kpi-purple { background: #7c3aed; }
    .kpi-green { background: #059669; }

    .kpi-info { display: flex; flex-direction: column; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #0f172a; }
    .kpi-label { font-size: 11px; color: #64748b; }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .task-card {
      padding: 20px !important;
      border-radius: 12px !important;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .project-tag {
      font-size: 12px;
      font-weight: 600;
      color: #3b82f6;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .task-title { font-size: 16px; margin: 0 0 8px; color: #0f172a; font-weight: 700; }
    .task-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 16px; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    .task-meta {
      font-size: 12px;
      color: #64748b;
      .deadline { display: flex; align-items: center; gap: 4px; }
    }
    .status-select {
      width: 130px;
      font-size: 12px;
    }
  `],
})
export class MyTasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  tasks = signal<Task[]>([]);
  filterStatus = 'ALL';

  statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

  ngOnInit(): void {
    this.loadMyTasks();
  }

  loadMyTasks(): void {
    this.loading.set(true);
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.loading.set(false);
      return;
    }

    // Resolve employee id from userId
    this.employeeService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(employees => {
        const myEmp = employees.find(e => e.userId === currentUser.id);
        const empId = myEmp ? myEmp.id : currentUser.id;

        this.taskService
          .getByEmployee(empId)
          .pipe(catchError(() => of([])))
          .subscribe(list => {
            this.tasks.set(list);
            this.loading.set(false);
          });
      });
  }

  filteredTasks(): Task[] {
    if (this.filterStatus === 'ALL') return this.tasks();
    return this.tasks().filter(t => t.status === this.filterStatus);
  }

  getCount(status: string): number {
    return this.tasks().filter(t => t.status === status).length;
  }

  updateTaskStatus(task: Task, newStatus: TaskStatus): void {
    this.taskService
      .update(task.id, {
        projectId: task.projectId,
        employeeId: task.employeeId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
        deadline: task.deadline,
      })
      .subscribe({
        next: updated => {
          this.snackBar.open('Statut de la tâche mis à jour', 'OK', { duration: 3000 });
          this.loadMyTasks();
        },
        error: () => this.snackBar.open('Mise à jour échouée', 'Fermer', { duration: 4000 }),
      });
  }
}
