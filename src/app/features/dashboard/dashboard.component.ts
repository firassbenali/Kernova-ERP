import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EmployeeService } from '../../core/services/employee.service';
import { TeamService } from '../../core/services/team.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { Project } from '../../domain/models/project.model';
import { Task } from '../../domain/models/task.model';
import { Notification } from '../../domain/models/notification.model';

interface KpiCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    StatusChipComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Welcome back, {{ userName() }}</p>
        </div>
      </div>

      <div class="kpi-grid">
        @for (kpi of kpis(); track kpi.label) {
          <mat-card class="kpi-card">
            <div class="kpi-card__icon" [style.background]="kpi.color + '18'" [style.color]="kpi.color">
              <mat-icon>{{ kpi.icon }}</mat-icon>
            </div>
            <div class="kpi-card__content">
              <span class="kpi-card__value">{{ kpi.value }}</span>
              <span class="kpi-card__label">{{ kpi.label }}</span>
            </div>
          </mat-card>
        }
      </div>

      <div class="dashboard-grid">
        <mat-card class="section-card">
          <div class="card-header">
            <h2>Project Progress</h2>
          </div>
          <div class="table-wrap" style="position: relative">
            <app-loading-overlay [loading]="loading()"></app-loading-overlay>
            @if (projects().length === 0 && !loading()) {
              <p class="empty-msg">No projects found.</p>
            } @else {
              <table mat-table [dataSource]="projects()" class="w-full">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let p">{{ p.name }}</td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let p">
                    <app-status-chip [status]="p.status"></app-status-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="progress">
                  <th mat-header-cell *matHeaderCellDef>Progress</th>
                  <td mat-cell *matCellDef="let p">
                    <div class="progress-cell">
                      <mat-progress-bar mode="determinate" [value]="p.progress"></mat-progress-bar>
                      <span>{{ p.progress }}%</span>
                    </div>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="projectColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: projectColumns"></tr>
              </table>
            }
          </div>
        </mat-card>

        <div class="side-panels">
          <mat-card class="section-card">
            <div class="card-header"><h2>Task Summary</h2></div>
            <div class="task-summary">
              @for (entry of taskSummary(); track entry.status) {
                <div class="task-summary__row">
                  <app-status-chip [status]="entry.status"></app-status-chip>
                  <span class="task-summary__count">{{ entry.count }}</span>
                </div>
              }
              @if (taskSummary().length === 0 && !loading()) {
                <p class="empty-msg">No tasks yet.</p>
              }
            </div>
          </mat-card>

          <mat-card class="section-card">
            <div class="card-header">
              <h2>Recent Notifications</h2>
              <a routerLink="/notifications" class="view-all">View all</a>
            </div>
            <div class="notif-list">
              @for (n of recentNotifications(); track n.idNotification) {
                <div class="notif-item" [class.notif-item--unread]="!n.isRead">
                  <div class="notif-item__title">{{ n.title }}</div>
                  <div class="notif-item__msg">{{ n.message }}</div>
                </div>
              }
              @if (recentNotifications().length === 0 && !loading()) {
                <p class="empty-msg">No notifications.</p>
              }
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-secondary); font-size: 14px; margin-top: 4px; }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
    }

    .kpi-card__icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-card__value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      color: var(--color-text-primary);
    }

    .kpi-card__label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-top: 4px;
      display: block;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);

      h2 { font-size: 15px; font-weight: 600; margin: 0; }
    }

    .view-all {
      font-size: 13px;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }

    .table-wrap { overflow-x: auto; }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 160px;

      mat-progress-bar { flex: 1; }
      span { font-size: 12px; color: var(--color-text-secondary); min-width: 36px; }
    }

    .side-panels { display: flex; flex-direction: column; gap: 24px; }

    .task-summary { padding: 16px 20px; }
    .task-summary__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }
    .task-summary__count {
      font-weight: 600;
      font-size: 16px;
      color: var(--color-text-primary);
    }

    .notif-list { padding: 8px 0; max-height: 320px; overflow-y: auto; }
    .notif-item {
      padding: 12px 20px;
      border-bottom: 1px solid var(--color-border-light);

      &--unread { background: rgba(27, 58, 107, 0.04); }
    }
    .notif-item__title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .notif-item__msg { font-size: 12px; color: var(--color-text-secondary); }

    .empty-msg {
      padding: 24px 20px;
      color: var(--color-text-muted);
      text-align: center;
      font-size: 14px;
    }
  `],
})
export class DashboardComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private teamService = inject(TeamService);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);

  loading = signal(true);
  kpis = signal<KpiCard[]>([]);
  projects = signal<Project[]>([]);
  taskSummary = signal<{ status: string; count: number }[]>([]);
  recentNotifications = signal<Notification[]>([]);

  projectColumns = ['name', 'status', 'progress'];
  userName = computed(() => this.authService.currentUser()?.username ?? 'User');

  ngOnInit(): void {
    forkJoin({
      employees: this.employeeService.getAll().pipe(catchError(() => of([]))),
      teams: this.teamService.getAll().pipe(catchError(() => of([]))),
      projects: this.projectService.getAll().pipe(catchError(() => of([]))),
      tasks: this.taskService.getAll().pipe(catchError(() => of([]))),
      notifications: this.notificationService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ employees, teams, projects, tasks, notifications }) => {
      const activeEmployees = employees.filter(e => e.availability !== 'UNAVAILABLE').length;
      const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
      const openTasks = tasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED').length;
      const completedTasks = tasks.filter(t => t.status === 'DONE').length;

      this.kpis.set([
        { label: 'Total Employees', value: employees.length, icon: 'people', color: '#1B3A6B' },
        { label: 'Active Employees', value: activeEmployees, icon: 'person', color: '#16A34A' },
        { label: 'Teams', value: teams.length, icon: 'groups', color: '#7C3AED' },
        { label: 'Active Projects', value: activeProjects, icon: 'folder_open', color: '#2563EB' },
        { label: 'Open Tasks', value: openTasks, icon: 'task_alt', color: '#F59E0B' },
        { label: 'Completed Tasks', value: completedTasks, icon: 'check_circle', color: '#16A34A' },
      ]);

      this.projects.set(projects.slice(0, 8));

      const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      }, {});
      this.taskSummary.set(
        Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
      );

      this.recentNotifications.set(
        [...notifications]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      );

      this.loading.set(false);
    });
  }
}
