import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { TaskService } from '../../../core/services/task.service';
import { ResourcePlanningService } from '../../../core/services/resource-planning.service';
import { AuthService } from '../../../core/auth/auth.service';

import {
  Project,
  ProjectStatus,
  ProjectPriority,
  ProjectSummaryReport,
  ProjectBudgetReport,
} from '../../../domain/models/project.model';
import { Task } from '../../../domain/models/task.model';
import { ProjectDocument } from '../../../domain/models/project-document.model';
import { ProjectAllocation } from '../../../domain/models/resource-planning.model';

import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ProjectFormDialogComponent,
  ProjectDialogData,
} from '../project-form-dialog/project-form-dialog.component';
import {
  TaskFormDialogComponent,
  TaskDialogData,
} from '../../tasks/task-form-dialog/task-form-dialog.component';
import { DocumentUploadDialogComponent } from '../documents/document-upload-dialog/document-upload-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    StatusChipComponent,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DecimalPipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/projects"><mat-icon>arrow_back</mat-icon></a>
          <div>
            <h1>{{ project()?.name ?? 'Project' }}</h1>
            <span class="sub-text">ID: #{{ projectId }} | Phase: {{ project()?.currentPhase || 'Planning' }}</span>
          </div>
        </div>
        <div class="page-header-actions">
          <button mat-stroked-button (click)="edit()">
            <mat-icon>edit</mat-icon> Edit Full Details
          </button>
        </div>
      </div>

      <app-loading-overlay [loading]="loading()"></app-loading-overlay>

      @if (project(); as p) {
        <mat-tab-group class="project-tabs" animationDuration="150ms">
          <!-- TAB 1: OVERVIEW & QUICK EDIT CONTROLS -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <mat-card class="detail-card">
                <div class="progress-header">
                  <div class="flex gap-2 align-center">
                    <app-status-chip [status]="p.status"></app-status-chip>
                    <app-status-chip [status]="p.priority" type="priority"></app-status-chip>
                  </div>
                  <span class="phase-badge"><mat-icon inline>flag</mat-icon> Phase: {{ p.currentPhase }}</span>
                </div>

                <div class="progress-section">
                  <div class="progress-label">
                    <span>Overall Progress</span>
                    <strong>{{ p.progress }}%</strong>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="p.progress"></mat-progress-bar>
                </div>

                <p class="description">{{ p.description || 'No description available for this project.' }}</p>

                <div class="detail-grid">
                  <div><span class="label">Budget</span><span class="val">{{ p.budget | number }} TND</span></div>
                  <div><span class="label">Start Date</span><span class="val">{{ p.startDate || '—' }}</span></div>
                  <div><span class="label">Deadline</span><span class="val">{{ p.endDate || '—' }}</span></div>
                  <div><span class="label">Client ID</span><span class="val">{{ p.clientId ?? '—' }}</span></div>
                </div>
              </mat-card>

              <!-- Quick Update Controls Card -->
              <mat-card class="quick-controls-card">
                <h3><mat-icon inline color="primary">tune</mat-icon> Quick Project Controls</h3>
                <div class="controls-grid">
                  <div class="control-item">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic">
                      <mat-label>Change Status</mat-label>
                      <mat-select [(ngModel)]="editingStatus" (selectionChange)="onStatusChange($event.value)">
                        @for (s of statuses; track s) {
                          <mat-option [value]="s">{{ s.replace('_', ' ') }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="control-item flex-row">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                      <mat-label>Current Phase</mat-label>
                      <mat-select [(ngModel)]="editingPhase" (selectionChange)="savePhase()">
                        @for (ph of phases; track ph) {
                          <mat-option [value]="ph">{{ ph }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="control-item flex-row">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                      <mat-label>Progress (%)</mat-label>
                      <input matInput type="number" min="0" max="100" [(ngModel)]="editingProgress" />
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveProgress()">Save</button>
                  </div>

                  <div class="control-item flex-row">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                      <mat-label>Budget (TND)</mat-label>
                      <input matInput type="number" [(ngModel)]="editingBudget" />
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveBudget()">Save</button>
                  </div>

                  <div class="control-item flex-row">
                    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-1">
                      <mat-label>Deadline Date</mat-label>
                      <input matInput type="date" [(ngModel)]="editingDeadline" />
                    </mat-form-field>
                    <button mat-flat-button color="primary" (click)="saveDeadline()">Save</button>
                  </div>
                </div>
              </mat-card>
            </div>
          </mat-tab>

          <!-- TAB 2: TASKS -->
          <mat-tab label="Tasks">
            <div class="tab-content">
              <div class="section-toolbar flex justify-between align-center mb-4">
                <h2>Project Tasks ({{ tasks().length }})</h2>
                <button mat-flat-button color="primary" (click)="openTaskDialog()">
                  <mat-icon>add</mat-icon> New Task
                </button>
              </div>

              @if (tasksLoading()) {
                <app-loading-overlay [loading]="true"></app-loading-overlay>
              } @else if (tasks().length === 0) {
                <app-empty-state icon="task_alt" title="No tasks found" message="No tasks assigned to this project yet." />
              } @else {
                <table mat-table [dataSource]="tasksDataSource" class="w-full section-card">
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>Task</th>
                    <td mat-cell *matCellDef="let row">
                      <strong>{{ row.title }}</strong>
                      <div class="text-xs text-muted">{{ row.description }}</div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="employeeName">
                    <th mat-header-cell *matHeaderCellDef>Assignee</th>
                    <td mat-cell *matCellDef="let row">{{ row.employeeName || 'Unassigned' }}</td>
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
                    <td mat-cell *matCellDef="let row">{{ row.deadline || '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row">
                      <button mat-icon-button [matMenuTriggerFor]="taskMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #taskMenu="matMenu">
                        <button mat-menu-item (click)="openTaskDialog(row)">
                          <mat-icon>edit</mat-icon> Edit Task
                        </button>
                        <button mat-menu-item (click)="deleteTask(row)">
                          <mat-icon color="warn">delete</mat-icon> Delete Task
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="taskColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: taskColumns"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- TAB 3: DOCUMENTS -->
          <mat-tab label="Documents">
            <div class="tab-content">
              <div class="section-toolbar flex justify-between align-center mb-4">
                <h2>Project Documents ({{ documents().length }})</h2>
                <button mat-flat-button color="primary" (click)="uploadDocument()">
                  <mat-icon>upload_file</mat-icon> Upload Document
                </button>
              </div>

              @if (documentsLoading()) {
                <app-loading-overlay [loading]="true"></app-loading-overlay>
              } @else if (documents().length === 0) {
                <app-empty-state icon="description" title="No documents uploaded" message="Upload project deliverables and files here." />
              } @else {
                <table mat-table [dataSource]="documentsDataSource" class="w-full section-card">
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef>Title</th>
                    <td mat-cell *matCellDef="let row">
                      <strong>{{ row.title }}</strong>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="category">
                    <th mat-header-cell *matHeaderCellDef>Category</th>
                    <td mat-cell *matCellDef="let row">{{ row.category || 'General' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="version">
                    <th mat-header-cell *matHeaderCellDef>Version</th>
                    <td mat-cell *matCellDef="let row">v{{ row.version || '1.0' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="uploadedAt">
                    <th mat-header-cell *matHeaderCellDef>Uploaded</th>
                    <td mat-cell *matCellDef="let row">{{ row.uploadedAt || '—' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row">
                      <button mat-icon-button (click)="downloadDoc(row)" title="Download">
                        <mat-icon color="primary">download</mat-icon>
                      </button>
                      <button mat-icon-button (click)="deleteDoc(row)" title="Delete">
                        <mat-icon color="warn">delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="docColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: docColumns"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- TAB 4: TEAM & RESOURCES -->
          <mat-tab label="Team & Allocation">
            <div class="tab-content">
              <div class="section-toolbar mb-4">
                <h2>Allocated Team Members</h2>
              </div>

              @if (teamLoading()) {
                <app-loading-overlay [loading]="true"></app-loading-overlay>
              } @else if (!teamAllocation() || teamAllocation()!.allocations.length === 0) {
                <app-empty-state icon="people" title="No resources allocated" message="No team members allocated to this project." />
              } @else {
                <div class="kpi-row mb-4">
                  <div class="kpi-box">
                    <span class="label">Total Allocation</span>
                    <span class="value">{{ teamAllocation()?.totalAllocation }}%</span>
                  </div>
                  <div class="kpi-box">
                    <span class="label">Team Size</span>
                    <span class="value">{{ teamAllocation()?.allocations?.length || 0 }} members</span>
                  </div>
                  <div class="kpi-box">
                    <span class="label">Total Project Tasks</span>
                    <span class="value">{{ teamAllocation()?.taskCount || 0 }}</span>
                  </div>
                </div>

                <table mat-table [dataSource]="teamAllocation()?.allocations || []" class="w-full section-card">
                  <ng-container matColumnDef="employeeName">
                    <th mat-header-cell *matHeaderCellDef>Employee</th>
                    <td mat-cell *matCellDef="let row">
                      <strong>{{ row.employeeName }}</strong>
                      <div class="text-xs text-muted">{{ row.department }}</div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Role</th>
                    <td mat-cell *matCellDef="let row">{{ row.role || 'Contributor' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="allocationPercentage">
                    <th mat-header-cell *matHeaderCellDef>Allocation %</th>
                    <td mat-cell *matCellDef="let row">
                      <div class="flex items-center gap-2">
                        <mat-progress-bar mode="determinate" [value]="row.allocationPercentage" style="width: 80px;"></mat-progress-bar>
                        <span>{{ row.allocationPercentage }}%</span>
                      </div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="dates">
                    <th mat-header-cell *matHeaderCellDef>Allocation Period</th>
                    <td mat-cell *matCellDef="let row">{{ row.startDate }} to {{ row.endDate }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['employeeName', 'role', 'allocationPercentage', 'dates']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['employeeName', 'role', 'allocationPercentage', 'dates']"></tr>
                </table>
              }
            </div>
          </mat-tab>

          <!-- TAB 5: REPORTS & BUDGET -->
          <mat-tab label="Reports & Budget">
            <div class="tab-content">
              <div class="section-toolbar mb-4">
                <h2>Project Summary & Budget Breakdown</h2>
              </div>

              <!-- Summary Cards -->
              @if (summaryReport(); as sum) {
                <div class="summary-cards-grid mb-6">
                  <div class="summary-box">
                    <mat-icon color="primary">task</mat-icon>
                    <div>
                      <span class="box-title">Total Tasks</span>
                      <span class="box-val">{{ sum.taskCount ?? tasks().length }}</span>
                    </div>
                  </div>
                  <div class="summary-box">
                    <mat-icon style="color: #10b981">check_circle</mat-icon>
                    <div>
                      <span class="box-title">Completed Tasks</span>
                      <span class="box-val">{{ sum.completedTasksCount ?? getCompletedTasksCount() }}</span>
                    </div>
                  </div>
                  <div class="summary-box">
                    <mat-icon style="color: #6366f1">folder</mat-icon>
                    <div>
                      <span class="box-title">Documents</span>
                      <span class="box-val">{{ sum.documentCount ?? documents().length }}</span>
                    </div>
                  </div>
                  <div class="summary-box">
                    <mat-icon style="color: #f59e0b">people</mat-icon>
                    <div>
                      <span class="box-title">Team Size</span>
                      <span class="box-val">{{ sum.teamSize ?? (teamAllocation()?.allocations?.length || 0) }}</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Budget Report (Admin / Manager Only) -->
              @if (isManagerOrAdmin()) {
                <mat-card class="budget-report-card">
                  <div class="card-header">
                    <h3><mat-icon inline color="primary">account_balance_wallet</mat-icon> Overall Budget Report & Statistics</h3>
                  </div>

                  @if (budgetLoading()) {
                    <app-loading-overlay [loading]="true"></app-loading-overlay>
                  } @else if (budgetReport(); as b) {
                    <div class="kpi-row mb-6">
                      <div class="kpi-box">
                        <span class="label">Total Budget</span>
                        <span class="value">{{ b.stats?.total | number }} TND</span>
                      </div>
                      <div class="kpi-box">
                        <span class="label">Average Budget</span>
                        <span class="value">{{ b.stats?.average | number:'1.0-0' }} TND</span>
                      </div>
                      <div class="kpi-box">
                        <span class="label">Max Budget</span>
                        <span class="value">{{ b.stats?.max | number }} TND</span>
                      </div>
                      <div class="kpi-box">
                        <span class="label">Projects Count</span>
                        <span class="value">{{ b.stats?.projectCount }}</span>
                      </div>
                    </div>

                    <h4>Project Budget Comparison Table</h4>
                    <table mat-table [dataSource]="b.items || []" class="w-full section-card">
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>Project Name</th>
                        <td mat-cell *matCellDef="let row">
                          <strong>{{ row.name }}</strong>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>Status</th>
                        <td mat-cell *matCellDef="let row">
                          <app-status-chip [status]="row.status"></app-status-chip>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="budget">
                        <th mat-header-cell *matHeaderCellDef>Budget</th>
                        <td mat-cell *matCellDef="let row">
                          <strong>{{ row.budget | number }} TND</strong>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="['name', 'status', 'budget']"></tr>
                      <tr mat-row *matRowDef="let row; columns: ['name', 'status', 'budget']"></tr>
                    </table>
                  }
                </mat-card>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .sub-text { font-size: 12px; color: var(--color-text-secondary); }
    .project-tabs { margin-top: 16px; }
    .tab-content { padding: 20px 0; }
    .detail-card { padding: 24px !important; margin-bottom: 20px; }
    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .phase-badge {
      font-size: 13px;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      padding: 4px 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .progress-section { margin-bottom: 20px; }
    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .description {
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      .label {
        display: block;
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .val { font-weight: 600; color: #0f172a; }
    }

    .quick-controls-card {
      padding: 20px !important;
      h3 { margin: 0 0 16px; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .control-item { display: flex; flex-direction: column; }
    .flex-row { display: flex; align-items: center; gap: 8px; }
    .flex-1 { flex: 1; }

    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .summary-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
      div { display: flex; flex-direction: column; }
      .box-title { font-size: 12px; color: #64748b; }
      .box-val { font-size: 20px; font-weight: 700; color: #0f172a; }
    }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .kpi-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      .label { font-size: 12px; color: #64748b; }
      .value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 4px; }
    }

    .budget-report-card { padding: 24px !important; }
    .section-card { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  `],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private resourceService = inject(ResourcePlanningService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  project = signal<Project | null>(null);
  projectId = 0;

  statuses: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'];
  phases: string[] = ['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSING'];

  // Quick edit models
  editingStatus: ProjectStatus = 'PLANNED';
  editingPhase = '';
  editingProgress = 0;
  editingBudget = 0;
  editingDeadline = '';

  // Tasks
  tasksLoading = signal(false);
  tasks = signal<Task[]>([]);
  tasksDataSource = new MatTableDataSource<Task>([]);
  taskColumns = ['title', 'employeeName', 'priority', 'status', 'deadline', 'actions'];

  // Documents
  documentsLoading = signal(false);
  documents = signal<ProjectDocument[]>([]);
  documentsDataSource = new MatTableDataSource<ProjectDocument>([]);
  docColumns = ['title', 'category', 'version', 'uploadedAt', 'actions'];

  // Team
  teamLoading = signal(false);
  teamAllocation = signal<ProjectAllocation | null>(null);

  // Reports
  summaryReport = signal<ProjectSummaryReport | null>(null);
  budgetLoading = signal(false);
  budgetReport = signal<ProjectBudgetReport | null>(null);

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
  }

  isManagerOrAdmin(): boolean {
    return this.authService.hasRole('ADMIN', 'MANAGER');
  }

  loadAll(): void {
    this.loadProject();
    this.loadTasks();
    this.loadDocuments();
    this.loadTeam();
    this.loadReports();
  }

  loadProject(): void {
    this.loading.set(true);
    this.projectService
      .getById(this.projectId)
      .pipe(catchError(() => of(null)))
      .subscribe(p => {
        this.project.set(p);
        if (p) {
          this.editingStatus = p.status;
          this.editingPhase = p.currentPhase || '';
          this.editingProgress = p.progress || 0;
          this.editingBudget = p.budget || 0;
          this.editingDeadline = p.endDate || '';
        }
        this.loading.set(false);
      });
  }

  loadTasks(): void {
    this.tasksLoading.set(true);
    this.taskService
      .getByProject(this.projectId)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.tasks.set(list);
        this.tasksDataSource.data = list;
        this.tasksLoading.set(false);
      });
  }

  loadDocuments(): void {
    this.documentsLoading.set(true);
    this.projectService
      .getDocuments(this.projectId)
      .pipe(catchError(() => of([])))
      .subscribe(list => {
        this.documents.set(list);
        this.documentsDataSource.data = list;
        this.documentsLoading.set(false);
      });
  }

  loadTeam(): void {
    this.teamLoading.set(true);
    this.resourceService
      .getProjectAllocation(this.projectId)
      .pipe(catchError(() => of(null)))
      .subscribe(res => {
        this.teamAllocation.set(res);
        this.teamLoading.set(false);
      });
  }

  loadReports(): void {
    this.projectService
      .getSummary(this.projectId)
      .pipe(catchError(() => of(null)))
      .subscribe(s => this.summaryReport.set(s));

    if (this.isManagerOrAdmin()) {
      this.budgetLoading.set(true);
      this.projectService
        .getBudgetReport()
        .pipe(catchError(() => of(null)))
        .subscribe(b => {
          this.budgetReport.set(b);
          this.budgetLoading.set(false);
        });
    }
  }

  getCompletedTasksCount(): number {
    return this.tasks().filter(t => t.status === 'DONE').length;
  }

  // Quick edit PATCH handlers
  onStatusChange(status: ProjectStatus): void {
    this.projectService.updateStatus(this.projectId, status).subscribe({
      next: updated => {
        this.project.set(updated);
        this.snackBar.open('Status updated', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Status update failed', 'Dismiss', { duration: 4000 }),
    });
  }

  savePhase(): void {
    if (!this.editingPhase) return;
    this.projectService.updatePhase(this.projectId, this.editingPhase).subscribe({
      next: updated => {
        this.project.set(updated);
        this.snackBar.open('Phase updated', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Phase update failed', 'Dismiss', { duration: 4000 }),
    });
  }

  saveProgress(): void {
    this.projectService.updateProgress(this.projectId, this.editingProgress).subscribe({
      next: updated => {
        this.project.set(updated);
        this.snackBar.open('Progress updated', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Progress update failed', 'Dismiss', { duration: 4000 }),
    });
  }

  saveBudget(): void {
    this.projectService.updateBudget(this.projectId, this.editingBudget).subscribe({
      next: updated => {
        this.project.set(updated);
        this.snackBar.open('Budget updated', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Budget update failed', 'Dismiss', { duration: 4000 }),
    });
  }

  saveDeadline(): void {
    if (!this.editingDeadline) return;
    this.projectService.updateDeadline(this.projectId, this.editingDeadline).subscribe({
      next: updated => {
        this.project.set(updated);
        this.snackBar.open('Deadline updated', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Deadline update failed', 'Dismiss', { duration: 4000 }),
    });
  }

  // Dialog actions
  edit(): void {
    const p = this.project();
    if (!p) return;
    this.dialog
      .open(ProjectFormDialogComponent, {
        width: '520px',
        data: { project: p } satisfies ProjectDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.projectService.update(p.id, form))
      )
      .subscribe({
        next: updated => {
          this.project.set(updated);
          this.snackBar.open('Project updated', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Update failed', 'Dismiss', { duration: 4000 }),
      });
  }

  openTaskDialog(task?: Task): void {
    this.dialog
      .open(TaskFormDialogComponent, {
        width: '520px',
        data: { task, projectId: this.projectId } satisfies TaskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          task ? this.taskService.update(task.id, form) : this.taskService.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(task ? 'Task updated' : 'Task created', 'OK', { duration: 3000 });
          this.loadTasks();
        },
        error: () => this.snackBar.open('Task action failed', 'Dismiss', { duration: 4000 }),
      });
  }

  deleteTask(task: Task): void {
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
        switchMap(() => this.taskService.delete(task.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Task deleted', 'OK', { duration: 3000 });
          this.loadTasks();
        },
        error: () => this.snackBar.open('Delete task failed', 'Dismiss', { duration: 4000 }),
      });
  }

  uploadDocument(): void {
    this.dialog
      .open(DocumentUploadDialogComponent, {
        width: '480px',
        data: { projectId: this.projectId },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(formData => this.projectService.uploadDocument(this.projectId, formData))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Document uploaded', 'OK', { duration: 3000 });
          this.loadDocuments();
        },
        error: () => this.snackBar.open('Upload failed', 'Dismiss', { duration: 4000 }),
      });
  }

  downloadDoc(doc: ProjectDocument): void {
    this.projectService.downloadDocument(doc.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.title || 'document';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Dismiss', { duration: 4000 }),
    });
  }

  deleteDoc(doc: ProjectDocument): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Document',
          message: `Delete "${doc.title}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.projectService.deleteDocument(doc.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'OK', { duration: 3000 });
          this.loadDocuments();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
