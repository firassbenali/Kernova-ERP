import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { ResourcePlanningService } from '../../../../core/services/resource-planning.service';
import {
  ProjectAllocation,
  EmployeeAllocationSummary,
} from '../../../../domain/models/resource-planning.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-project-allocation-view',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgClass,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/rh/resource-planning/allocations"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1>{{ allocation()?.projectName ?? 'Project' }}</h1>
            @if (allocation(); as a) {
              <p class="subtitle">{{ a.projectStatus }} · {{ a.taskCount }} tasks</p>
            }
          </div>
        </div>
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && !allocation()) {
          <app-empty-state
            icon="folder"
            title="Project not found"
            message="This project does not exist or has no allocation data."
          />
        }

        @if (allocation(); as a) {
          <div class="kpis">
            <div class="section-card kpi">
              <span class="kpi__label">Total Allocation</span>
              <span class="kpi__value" [ngClass]="allocationClass(a.totalAllocation)">{{ a.totalAllocation }}%</span>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Assigned Employees</span>
              <span class="kpi__value">{{ a.allocations.length }}</span>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Tasks</span>
              <span class="kpi__value">{{ a.taskCount }}</span>
            </div>
            <div class="section-card kpi">
              <span class="kpi__label">Period</span>
              <span class="kpi__value">{{ a.projectStartDate | date: 'MMM d, y' }} → {{ a.projectEndDate | date: 'MMM d, y' }}</span>
            </div>
          </div>

          <mat-card class="breakdown-card">
            <div class="card-header"><h2>Employee Allocations</h2></div>
            @if (a.allocations.length === 0) {
              <p class="empty-msg">No employees allocated to this project.</p>
            } @else {
              <table mat-table [dataSource]="a.allocations" class="w-full">
                <ng-container matColumnDef="employeeName">
                  <th mat-header-cell *matHeaderCellDef>Employee</th>
                  <td mat-cell *matCellDef="let row">
                    <a [routerLink]="['/rh/resource-planning/employees', row.employeeId, 'workload']">{{ row.employeeName }}</a>
                  </td>
                </ng-container>
                <ng-container matColumnDef="department">
                  <th mat-header-cell *matHeaderCellDef>Department</th>
                  <td mat-cell *matCellDef="let row">{{ row.department }}</td>
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

      a { color: var(--color-primary); text-decoration: none; }
      a:hover { text-decoration: underline; }
    `,
  ],
})
export class ProjectAllocationViewComponent implements OnInit {
  private service = inject(ResourcePlanningService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  allocation = signal<ProjectAllocation | null>(null);

  columns = ['employeeName', 'department', 'allocationPercentage', 'period', 'role'];

  ngOnInit(): void {
    const projectId = Number(this.route.snapshot.paramMap.get('projectId'));
    if (!Number.isFinite(projectId)) {
      this.loading.set(false);
      return;
    }
    this.service.getProjectAllocation(projectId).pipe(catchError(() => of(null))).subscribe(allocation => {
      this.allocation.set(allocation);
      this.loading.set(false);
    });
  }

  allocationClass(percentage: number): string {
    if (percentage <= 50) return 'allocation-low';
    if (percentage <= 80) return 'allocation-mid';
    return 'allocation-high';
  }
}