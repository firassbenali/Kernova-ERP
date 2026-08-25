import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Employee } from '../../../../domain/models/employee.model';
import { EmployeeSkill, SkillLevel } from '../../../../domain/models/employee-skill.model';
import { GapChartComponent } from '../../../../shared/components/gap-chart/gap-chart.component';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmployeeSkillDialogComponent } from '../employee-skill-dialog/employee-skill-dialog.component';
import {
  EmployeeFormDialogComponent,
  EmployeeDialogData,
} from '../employee-form-dialog/employee-form-dialog.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule,
    StatusChipComponent,
    LoadingOverlayComponent,
    DatePipe,
    GapChartComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/rh/employees"><mat-icon>arrow_back</mat-icon></a>
          <h1>{{ employee()?.username ?? 'Employee' }}</h1>
        </div>
        <div class="page-header-actions">
          <button mat-stroked-button (click)="edit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
        </div>
      </div>

      <div style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (employee(); as emp) {
          <mat-card class="detail-card">
            <div class="detail-grid">
              <div><span class="label">Email</span><span>{{ emp.userEmail }}</span></div>
              <div><span class="label">Department</span><span>{{ emp.departmentName }}</span></div>
              <div><span class="label">Position</span><span>{{ emp.positionTitle }}</span></div>
              <div><span class="label">Phone</span><span>{{ emp.phone || '—' }}</span></div>
              <div><span class="label">Hire Date</span><span>{{ emp.hireDate | date:'mediumDate' }}</span></div>
              <div>
                <span class="label">Availability</span>
                <app-status-chip [status]="emp.availability" type="availability"></app-status-chip>
              </div>
            </div>
          </mat-card>

          <mat-tab-group>
            <mat-tab label="Competencies">
              <mat-card class="skills-card">
                <div class="skills-header">
                  <h2>Competencies</h2>
                  <button mat-flat-button color="primary" (click)="assignSkill()">
                    <mat-icon>add</mat-icon> Assign Skill
                  </button>
                </div>
                @if (skills().length === 0) {
                  <p class="empty-msg">No skills assigned yet.</p>
                } @else {
                  <table mat-table [dataSource]="skills()" class="w-full">
                    <ng-container matColumnDef="skillName">
                      <th mat-header-cell *matHeaderCellDef>Skill</th>
                      <td mat-cell *matCellDef="let s">{{ s.skillName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="currentLevel">
                      <th mat-header-cell *matHeaderCellDef>Current Level</th>
                      <td mat-cell *matCellDef="let s">
                        <mat-chip [class]="'level-' + s.level.toLowerCase()">{{ s.level }}</mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="targetLevel">
                      <th mat-header-cell *matHeaderCellDef>Target Level</th>
                      <td mat-cell *matCellDef="let s">
                        <span *ngIf="s.targetLevel">
                          <mat-chip [class]="'level-' + s.targetLevel.toLowerCase()">{{ s.targetLevel }}</mat-chip>
                        </span>
                        <span *ngIf="!s.targetLevel" class="text-muted">Not set</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="gap">
                      <th mat-header-cell *matHeaderCellDef>Gap</th>
                      <td mat-cell *matCellDef="let s">
                        <div *ngIf="s.targetLevel" class="gap-indicator">
                          <mat-progress-bar mode="determinate"
                            [value]="getGapPercentage(s)"
                            [color]="getGapColor(s)">
                          </mat-progress-bar>
                          <span class="gap-text">{{ getGapText(s) }}</span>
                        </div>
                        <span *ngIf="!s.targetLevel" class="text-muted">No target</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="yearsExperience">
                      <th mat-header-cell *matHeaderCellDef>Years Exp.</th>
                      <td mat-cell *matCellDef="let s">{{ s.yearsOfExperience || 'N/A' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="lastAssessed">
                      <th mat-header-cell *matHeaderCellDef>Last Assessed</th>
                      <td mat-cell *matCellDef="let s">
                        {{ s.lastAssessedDate ? formatDate(s.lastAssessedDate) : 'Never' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="certification">
                      <th mat-header-cell *matHeaderCellDef>Certification</th>
                      <td mat-cell *matCellDef="let s">
                        <span class="cert-badge" [class]="getCertClass(s.certificationStatus)">
                          {{ s.certificationStatus || 'Not started' }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let s">
                        <button mat-icon-button (click)="editSkill(s)" matTooltip="Edit competency">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button (click)="removeSkill(s)" aria-label="Remove skill" color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="skillColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: skillColumns"></tr>
                  </table>
                }
              </mat-card>
            </mat-tab>

            <mat-tab label="Skill Gaps">
              <mat-card class="gaps-card">
                <div class="skills-header">
                  <h2>Skill Gap Analysis</h2>
                </div>
                @if (skills().length === 0) {
                  <p class="empty-msg">No skills to analyze.</p>
                } @else {
<mat-card class="gap-chart-card">
                      <mat-card-header>
                        <mat-card-title>Gap Visualization</mat-card-title>
                        <mat-card-subtitle>Current vs Target level comparison</mat-card-subtitle>
                      </mat-card-header>
                      <mat-card-content>
                        <app-gap-chart [gapData]="gapChartData()"></app-gap-chart>
                      </mat-card-content>
                    </mat-card>

                  <table mat-table [dataSource]="skillsWithGap()" class="w-full">
                    <ng-container matColumnDef="skillName">
                      <th mat-header-cell *matHeaderCellDef>Skill</th>
                      <td mat-cell *matCellDef="let s">{{ s.skillName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="currentLevel">
                      <th mat-header-cell *matHeaderCellDef>Current</th>
                      <td mat-cell *matCellDef="let s">
                        <mat-chip [class]="'level-' + s.level.toLowerCase()">{{ s.level }}</mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="targetLevel">
                      <th mat-header-cell *matHeaderCellDef>Target</th>
                      <td mat-cell *matCellDef="let s">
                        <mat-chip *ngIf="s.targetLevel" [class]="'level-' + s.targetLevel.toLowerCase()">{{ s.targetLevel }}</mat-chip>
                        <span *ngIf="!s.targetLevel" class="text-muted">Not set</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="gap">
                      <th mat-header-cell *matHeaderCellDef>Gap</th>
                      <td mat-cell *matCellDef="let s">
                        <div *ngIf="s.targetLevel" class="gap-indicator">
                          <mat-progress-bar mode="determinate"
                            [value]="getGapPercentage(s)"
                            [color]="getGapColor(s)">
                          </mat-progress-bar>
                          <span class="gap-text">{{ getGapText(s) }}</span>
                        </div>
                        <span *ngIf="!s.targetLevel" class="text-muted">Set target to see gap</span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="development">
                      <th mat-header-cell *matHeaderCellDef>Development Action</th>
                      <td mat-cell *matCellDef="let s">
                        <span class="dev-action" *ngIf="s.targetLevel && getGapPercentage(s) < 100">
                          Needs {{ getLevelDiff(s) }} level{{ getLevelDiff(s) > 1 ? 's' : '' }} improvement
                        </span>
                        <span *ngIf="!s.targetLevel" class="text-muted">Set target level</span>
                        <span *ngIf="s.targetLevel && getGapPercentage(s) >= 100" class="text-success">Target met</span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="gapColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: gapColumns"></tr>
                  </table>
                }
              </mat-card>
            </mat-tab>
          </mat-tab-group>
        }
      </div>
    </div>
  `,
  styles: [`
    .detail-card { padding: 24px !important; margin-bottom: 24px; }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }
    .label {
      display: block;
      font-size: 12px;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .skills-card { overflow: hidden; }
    .skills-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);
    }
    .skills-header h2 { font-size: 15px; font-weight: 600; margin: 0; }
    .empty-msg { padding: 24px 20px; color: var(--color-text-muted); }
    .gaps-card { overflow: hidden; }

    th.mat-header-cell, td.mat-cell { padding: 12px 16px; }

    .gap-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }
    .gap-indicator ::ng-deep .mat-mdc-progress-bar {
      height: 6px;
      border-radius: 3px;
      flex: 1;
    }
    .gap-text { font-size: 12px; font-weight: 500; white-space: nowrap; }

    .text-muted { color: var(--color-text-muted); font-style: italic; font-size: 12px; }
    .text-success { color: #16A34A; font-weight: 500; }

    .dev-action { font-size: 12px; color: var(--color-text-secondary); }

    .cert-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .cert-badge.certified { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .cert-badge.in-progress { background: rgba(217, 119, 6, 0.15); color: #D97706; }
    .cert-badge.pending { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .cert-badge.not-started { background: rgba(220, 38, 38, 0.15); color: #DC2626; }

    .level-beginner { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .level-intermediate { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .level-advanced { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .level-expert { background: rgba(22, 163, 74, 0.15); color: #16A34A; }

@media (max-width: 768px) {
        table { min-width: 800px; }
        .gap-indicator { min-width: 150px; }
      }

      .gap-chart-card { margin-bottom: 24px; }
    `],
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  employee = signal<Employee | null>(null);
  skills = signal<EmployeeSkill[]>([]);

  skillColumns = ['skillName', 'currentLevel', 'targetLevel', 'gap', 'yearsExperience', 'lastAssessed', 'certification', 'actions'];
  gapColumns = ['skillName', 'currentLevel', 'targetLevel', 'gap', 'development'];

  private employeeId = 0;

  ngOnInit(): void {
    this.employeeId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      employee: this.service.getById(this.employeeId).pipe(catchError(() => of(null))),
      skills: this.service.getSkills(this.employeeId).pipe(catchError(() => of([]))),
    }).subscribe(({ employee, skills }) => {
      this.employee.set(employee);
      this.skills.set(skills);
      this.loading.set(false);
    });
  }

skillsWithGap = computed(() => this.skills().filter(s => 
    s.targetLevel && this.getLevelIndex(s.level) < this.getLevelIndex(s.targetLevel)
  ));

gapChartData = computed(() => this.skills().filter(s => 
      s.targetLevel && this.getLevelIndex(s.level) < this.getLevelIndex(s.targetLevel)
    ).map(s => ({
      skillName: s.skillName,
      currentLevel: this.getLevelIndex(s.level),
      targetLevel: this.getLevelIndex(s.targetLevel),
    })));

  getGapPercentage(skill: EmployeeSkill): number {
    const current = this.getLevelIndex(skill.level);
    const target = this.getLevelIndex(skill.targetLevel || skill.level);
    if (target === 0) return 100;
    return Math.round((current / target) * 100);
  }

  getGapColor(skill: EmployeeSkill): 'primary' | 'accent' | 'warn' {
    const current = this.getLevelIndex(skill.level);
    const target = this.getLevelIndex(skill.targetLevel || skill.level);
    if (current >= target) return 'primary';
    if (current >= target - 1) return 'accent';
    return 'warn';
  }

  getGapText(skill: EmployeeSkill): string {
    const current = this.getLevelIndex(skill.level);
    const target = this.getLevelIndex(skill.targetLevel || skill.level);
    const gap = target - current;
    if (gap <= 0) return 'At target';
    return `${gap} level${gap > 1 ? 's' : ''} to target`;
  }

  getLevelDiff(skill: EmployeeSkill): number {
    const current = this.getLevelIndex(skill.level);
    const target = this.getLevelIndex(skill.targetLevel || skill.level);
    return Math.max(0, target - current);
  }

  getLevelIndex(level: string): number {
    const levels: { [key: string]: number } = {
      'BEGINNER': 1,
      'INTERMEDIATE': 2,
      'ADVANCED': 3,
      'EXPERT': 4,
    };
    return levels[level] || 0;
  }

  getCertClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'Certified': 'certified',
      'In Progress': 'in-progress',
      'Pending': 'pending',
      'Not started': 'not-started',
    };
    return classMap[status] || 'not-started';
  }

  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  edit(): void {
    const emp = this.employee();
    if (!emp) return;
    this.dialog
      .open(EmployeeFormDialogComponent, {
        width: '480px',
        data: { employee: emp } satisfies EmployeeDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.service.update(emp.id, form))
      )
      .subscribe({
        next: updated => {
          this.employee.set(updated);
          this.snackBar.open('Employee updated', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Update failed', 'Dismiss', { duration: 4000 }),
      });
  }

assignSkill(): void {
      this.dialog
        .open(EmployeeSkillDialogComponent, {
          width: '400px',
          data: {
            employeeId: this.employeeId,
            existingSkillIds: this.skills().map(s => s.skillId),
          },
        })
        .afterClosed()
        .pipe(
          filter(Boolean),
          switchMap(req => this.service.assignSkillWithDetails(
            this.employeeId,
            req.skillId,
            req.level,
            req.targetLevel || '',
            req.yearsOfExperience || 0
          ))
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Skill assigned', 'OK', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Failed to assign skill', 'Dismiss', { duration: 4000 }),
        });
    }

editSkill(skill: EmployeeSkill): void {
      this.dialog
        .open(EmployeeSkillDialogComponent, {
          width: '400px',
          data: {
            employeeId: this.employeeId,
            existingSkillIds: this.skills().map(s => s.skillId),
            skill: {
              skillId: skill.skillId,
              level: skill.level,
              targetLevel: skill.targetLevel,
              yearsOfExperience: skill.yearsOfExperience,
            },
          },
        })
        .afterClosed()
        .pipe(
          filter(Boolean),
          switchMap(req => this.service.updateSkillLevel(
            this.employeeId,
            skill.skillId,
            req
          ))
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Competency updated', 'OK', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Update failed', 'Dismiss', { duration: 4000 }),
        });
    }

  removeSkill(skill: EmployeeSkill): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Remove Skill',
          message: `Remove ${skill.skillName} from this employee?`,
          confirmLabel: 'Remove',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.removeSkill(this.employeeId, skill.skillId))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Skill removed', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Remove failed', 'Dismiss', { duration: 4000 }),
      });
  }
}