import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { EmployeeService } from '../../../../core/services/employee.service';
import { EmployeeSkill, SkillLevel } from '../../../../domain/models/employee-skill.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-employee-competencies',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Employee Competencies</h1>
        <p class="subtitle">Track and manage employee skill competencies</p>
      </div>

      <div style="position: relative;">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        <ng-container *ngIf="!loading() && employeeSkills.length === 0; else hasSkills">
          <app-empty-state
            icon="psychology"
            title="No competencies found"
            message="Add skills to track employee competencies."
          />
        </ng-container>

        <ng-template #hasSkills>
          <div class="competencies-grid">
            <div class="summary-cards">
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-value">{{ totalSkills }}</div>
                  <div class="summary-label">Total Skills</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-value">{{ skillsAtExpert }}</div>
                  <div class="summary-label">Expert Level</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-value">{{ skillsWithGap }}</div>
                  <div class="summary-label">Skills with Gaps</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="summary-card">
                <mat-card-content>
                  <div class="summary-value">{{ certifiedSkills }}</div>
                  <div class="summary-label">Certified Skills</div>
                </mat-card-content>
              </mat-card>
            </div>

            <mat-card class="competencies-table-card">
              <mat-card-header>
                <mat-card-title>Competency Details</mat-card-title>
                <mat-card-subtitle>Current level vs target level analysis</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="employeeSkills" class="competencies-table">

                  <ng-container matColumnDef="skillName">
                    <th mat-header-cell *matHeaderCellDef>Skill</th>
                    <td mat-cell *matCellDef="let skill">
                      <strong>{{ skill.skillName }}</strong>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="currentLevel">
                    <th mat-header-cell *matHeaderCellDef>Current Level</th>
                    <td mat-cell *matCellDef="let skill">
                      <mat-chip [class]="getLevelClass(skill.level)">
                        {{ skill.level }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="targetLevel">
                    <th mat-header-cell *matHeaderCellDef>Target Level</th>
                    <td mat-cell *matCellDef="let skill">
                      <mat-chip *ngIf="skill.targetLevel" [class]="getLevelClass(skill.targetLevel)">
                        {{ skill.targetLevel }}
                      </mat-chip>
                      <span *ngIf="!skill.targetLevel" class="text-muted">Not set</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="gap">
                    <th mat-header-cell *matHeaderCellDef>Gap</th>
                    <td mat-cell *matCellDef="let skill">
                      <div class="gap-indicator" *ngIf="skill.targetLevel">
                        <mat-progress-bar
                          mode="determinate"
                          [value]="getGapPercentage(skill)"
                          [color]="getGapColor(skill)">
                        </mat-progress-bar>
                        <span class="gap-text">{{ getGapText(skill) }}</span>
                      </div>
                      <span *ngIf="!skill.targetLevel" class="text-muted">No target</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="yearsExperience">
                    <th mat-header-cell *matHeaderCellDef>Years Exp.</th>
                    <td mat-cell *matCellDef="let skill">
                      {{ skill.yearsOfExperience || 'N/A' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="lastAssessed">
                    <th mat-header-cell *matHeaderCellDef>Last Assessed</th>
                    <td mat-cell *matCellDef="let skill">
                      {{ skill.lastAssessedDate ? formatDate(skill.lastAssessedDate) : 'Never' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="certification">
                    <th mat-header-cell *matHeaderCellDef>Certification</th>
                    <td mat-cell *matCellDef="let skill">
                      <span class="certification-badge" [class]="getCertificationClass(skill.certificationStatus)">
                        {{ skill.certificationStatus || 'Not started' }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let skill">
                      <button mat-icon-button [matMenuTriggerFor]="menu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #menu="matMenu">
                        <button mat-menu-item (click)="editCompetency(skill)">
                          <mat-icon>edit</mat-icon> Edit Competency
                        </button>
                        <button mat-menu-item (click)="viewGapAnalysis(skill)">
                          <mat-icon>analytics</mat-icon> Gap Analysis
                        </button>
                        <button mat-menu-item (click)="viewDevelopmentPlan(skill)">
                          <mat-icon>school</mat-icon> Development Plan
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-muted); font-size: 13px; margin: 4px 0 0; }

    .competencies-grid {
      display: grid;
      gap: 24px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .summary-card {
      text-align: center;
      padding: 20px !important;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--color-primary);
      line-height: 1;
    }

    .summary-label {
      font-size: 12px;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .competencies-table-card {
      overflow-x: auto;
    }

    .competencies-table {
      width: 100%;
    }

    th.mat-header-cell, td.mat-cell {
      padding: 12px 16px;
    }

    .gap-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 200px;
    }

    .gap-indicator ::ng-deep .mat-mdc-progress-bar {
      height: 6px;
      border-radius: 3px;
    }

    .gap-text {
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    .certification-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }

    .certification-badge.certified { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .certification-badge.in-progress { background: rgba(217, 119, 6, 0.15); color: #D97706; }
    .certification-badge.pending { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .certification-badge.not-started { background: rgba(220, 38, 38, 0.15); color: #DC2626; }

    .level-chip-beginner { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .level-chip-intermediate { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .level-chip-advanced { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .level-chip-expert { background: rgba(22, 163, 74, 0.15); color: #16A34A; }

    .text-muted { color: var(--color-text-muted); font-style: italic; font-size: 12px; }

    @media (max-width: 768px) {
      .competencies-table { min-width: 800px; }
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class EmployeeCompetenciesComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  employeeId: number = 0;
  loading = signal(true);
  employeeSkills: EmployeeSkill[] = [];

  displayedColumns = [
    'skillName',
    'currentLevel',
    'targetLevel',
    'gap',
    'yearsExperience',
    'lastAssessed',
    'certification',
    'actions',
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      this.loadCompetencies();
    });
  }

  loadCompetencies(): void {
    this.loading.set(true);
    this.employeeService.getSkills(this.employeeId).subscribe({
      next: (skills) => {
        this.employeeSkills = skills;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load competencies', err);
        this.loading.set(false);
      },
    });
  }

  get totalSkills(): number {
    return this.employeeSkills.length;
  }

  get skillsAtExpert(): number {
    return this.employeeSkills.filter(s => s.level === 'EXPERT').length;
  }

  get skillsWithGap(): number {
    return this.employeeSkills.filter(s =>
      s.targetLevel && this.getLevelIndex(s.level) < this.getLevelIndex(s.targetLevel)
    ).length;
  }

  get certifiedSkills(): number {
    return this.employeeSkills.filter(s => s.certificationStatus === 'Certified').length;
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

  getLevelClass(level: string): string {
    return `level-chip-${level.toLowerCase()}`;
  }

  getCertificationClass(status: string): string {
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

  editCompetency(skill: EmployeeSkill): void {
    // Navigate to edit dialog
    console.log('Edit competency:', skill);
  }

  viewGapAnalysis(skill: EmployeeSkill): void {
    console.log('View gap analysis:', skill);
  }

  viewDevelopmentPlan(skill: EmployeeSkill): void {
    console.log('View development plan:', skill);
  }
}