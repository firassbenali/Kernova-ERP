import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { ResourcePlanningService } from '../../../../core/services/resource-planning.service';
import {
  EmployeeWorkload,
  ProjectAllocationSummary,
  TaskSummary,
  WorkloadStatus,
} from '../../../../domain/models/resource-planning.model';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-employee-resource-view',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatCardModule,
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
          <a mat-icon-button routerLink="/rh/resource-planning/allocations"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1>{{ workload()?.employeeName ?? 'Employee' }}</h1>
            @if (workload(); as w) {
              <p class="subtitle">{{ w.department }} · {{ w.position }}</p>
            }
          </div>
        </div>
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && !workload()) {
          <app-empty-state
            icon="engineering"
            title="Employee not found"
            message="This employee does not exist or has no resource data."
          />
        }

        @if (workload(); as w) {
          <div class="kpis">
            <div class="section-card kpi">
              <span class="kpi__label">Total Allocation</span>
              <span class="kpi__value" [ngClass]="allocationClass(w.totalAllocation)">{{ w.totalAllocation }}%</span>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Workload Status</span>
              <app-status-chip [status]="w.workloadStatus" type="status"></app-status-chip>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Availability</span>
              <span class="kpi__value">{{ w.availability || '—' }}</span>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Active Tasks</span>
              <span class="kpi__value">{{ w.activeTasks }}</span>
            </div>
          </div>

          <mat-card class="breakdown-card">
            <div class="card-header"><h2>Current Projects</h2></div>
            @if (w.currentProjects.length === 0) {
              <p class="empty-msg">No active project allocations.</p>
            } @else {
              <table mat-table [dataSource]="w.currentProjects" class="w-full">
                <ng-container matColumnDef="projectName">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/rh/resource-planning/projects', row.projectId, 'allocation']">{{ row.projectName }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="allocationPercentage">
                  <th mat-header-cell *matHeaderCellDef>Allocation</th>
                  <td mat-cell *matCellDef="let row">
                    <span class="pill" [ngClass]="allocationClass(row.allocationPercentage)">{{ row.allocationPercentage }}%</span>
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
                <tr mat-header-row *matHeaderRowDef="projectColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: projectColumns"></tr>
              </table>
            }
          </mat-card>

          <mat-card class="breakdown-card">
            <div class="card-header"><h2>Current Tasks</h2></div>
            @if (w.currentTasks.length === 0) {
              <p class="empty-msg">No assigned tasks.</p>
            } @else {
              <table mat-table [dataSource]="w.currentTasks" class="w-full">
                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Task</th>
                  <td mat-cell *matCellDef="let row">{{ row.title }}</td>
                </ng-container>
                <ng-container matColumnDef="projectName">
                  <th mat-header-cell *matHeaderCellDef>Project</th>
                  <td mat-cell *matCellDef="let row">{{ row.projectName || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="priority">
                  <th mat-header-cell *matHeaderCellDef>Priority</th>
                  <td mat-cell *matCellDef="let row">
                    <app-status-chip [status]="row.priority" type="priority"></app-status-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let row"><app-status-chip [status]="row.status"></app-status-chip></td>
                </ng-container>
                <ng-container matColumnDef="deadline">
                  <th mat-header-cell *matHeaderCellDef>Deadline</th>
                  <td mat-cell *matCellDef="let row">
                    @if (row.deadline) {
                      <span [ngClass]="isOverdue(row.deadline, row.status) ? 'overdue' : ''">
                        {{ row.deadline | date: 'MMM d, y' }}
                      </span>
                    } @else {
                      <span>—</span>
                    }
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="taskColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: taskColumns"></tr>
              </table>
            }
          </mat-card>

          <mat-card class="breakdown-card">
            <h2>Workload Summary</h2>
            <div class="summary-grid">
              <div><span class="label">Assigned Tasks</span><span>{{ w.assignedTasks }}</span></div>
              <div><span class="label">Active Tasks</span><span>{{ w.activeTasks }}</span></div>
              <div><span class="label">Overdue Tasks</span><span class="overdue">{{ w.overdueTasks }}</span></div>
              <div><span class="label">Completed Tasks</span><span>{{ w.completedTasks }}</span></div>
            </div>
          </mat-card>
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

      .breakdown-card { padding: 24px !important; margin-bottom: 24px; }
      h2 { font-size: 16px; margin: 0 0 16px; }
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      .card-header h2 { margin: 0; }
      .empty-msg { color: var(--color-text-muted); margin: 0; padding: 20px 8px; }

      .pill {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12.5px;
      }
      .pill.allocation-low { background: rgba(22, 163, 74, 0.12); color: #16A34A; }
      .pill.allocation-mid { background: rgba(217, 119, 6, 0.14); color: #D97706; }
      .pill.allocation-high { background: rgba(220, 38, 38, 0.12); color: #DC2626; }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
        padding: 16px 4px;
      }
      .summary-grid > div { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
      .summary-grid .label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
      .overdue { color: #DC2626; font-weight: 700; }

      a { color: var(--color-primary); text-decoration: none; }
      a:hover { text-decoration: underline; }

      .overdue { color: #DC2626; font-weight: 600; }
    `,
  ],
})
export class EmployeeResourceViewComponent implements OnInit {
  private service = inject(ResourcePlanningService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  workload = signal<EmployeeWorkload | null>(null);

  projectColumns = ['projectName', 'allocationPercentage', 'period', 'role'];
  taskColumns = ['title', 'projectName', 'priority', 'status', 'deadline'];

  ngOnInit(): void {
    const employeeId = Number(this.route.snapshot.paramMap.get('employeeId'));
    if (!Number.isFinite(employeeId)) {
      this.loading.set(false);
      return;
    }
    this.service.getEmployeeWorkload(employeeId).pipe(catchError(() => of(null))).subscribe(workload => {
      this.workload.set(workload);
      this.loading.set(false);
    });
  }

  allocationClass(percentage: number): string {
    if (percentage <= 50) return 'allocation-low';
    if (percentage <= 80) return 'allocation-mid';
    return 'allocation-high';
  }

  isOverdue(deadline: string, status: string): boolean {
    if (status === 'COMPLETED') return false;
    return new Date(deadline) < new Date();
  }
}