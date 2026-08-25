import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EmployeeService } from '../../../../core/services/employee.service';
import { SkillService } from '../../../../core/services/skill.service';
import { Employee } from '../../../../domain/models/employee.model';
import { Skill, SkillCategory } from '../../../../domain/models/skill.model';
import { EmployeeSkill, SkillLevel } from '../../../../domain/models/employee-skill.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

interface SkillRequirement {
  skillId: number;
  skillName: string;
  category: string;
  requiredLevel: SkillLevel;
  mandatory: boolean;
}

interface EmployeeMatch {
  employee: Employee;
  skills: EmployeeSkill[];
  skillMatchScore: number;
  competencyScore: number;
  availabilityScore: number;
  totalScore: number;
  matchingSkills: SkillRequirement[];
  missingSkills: SkillRequirement[];
}

@Component({
  selector: 'app-employee-matching',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Employee Skill Matching</h1>
        <p class="subtitle">Find the best employees for project requirements</p>
      </div>

      <mat-card class="requirements-card">
        <mat-card-header>
          <mat-card-title>Project Requirements</mat-card-title>
          <mat-card-subtitle>Define required skills to find matching employees</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="requirements-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Project / Task Name</mat-label>
              <input matInput [(ngModel)]="projectName" placeholder="Enter project name">
            </mat-form-field>

            <div class="requirements-list">
              <h4>Required Skills</h4>
              <div class="requirement-row" *ngFor="let req of requirements; let i = index">
                <mat-form-field appearance="outline" class="skill-field">
                  <mat-label>Skill</mat-label>
                  <mat-select [(ngModel)]="req.skillId">
                    <mat-option *ngFor="let skill of availableSkills" [value]="skill.id">
                      {{ skill.name }} ({{ skill.category }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="level-field">
                  <mat-label>Required Level</mat-label>
                  <mat-select [(ngModel)]="req.requiredLevel">
                    <mat-option value="BEGINNER">Beginner</mat-option>
                    <mat-option value="INTERMEDIATE">Intermediate</mat-option>
                    <mat-option value="ADVANCED">Advanced</mat-option>
                    <mat-option value="EXPERT">Expert</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-checkbox [(ngModel)]="req.mandatory" class="mandatory-checkbox">
                  Mandatory
                </mat-checkbox>

                <button mat-icon-button color="warn" (click)="removeRequirement(i)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

              <button mat-stroked-button (click)="addRequirement()" class="add-req-btn">
                <mat-icon>add</mat-icon> Add Skill Requirement
              </button>
            </div>

            <button mat-flat-button color="primary" (click)="findMatches()" [disabled]="requirements.length === 0 || searching()"
                    class="search-btn">
              <mat-icon *ngIf="!searching()">search</mat-icon>
              <mat-icon *ngIf="searching()">hourglass_empty</mat-icon>
              {{ searching() ? 'Searching...' : 'Find Matching Employees' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div style="position: relative;">
        <app-loading-overlay [loading]="searching()"></app-loading-overlay>

        <ng-container *ngIf="!searching() && matches().length === 0 && !showResults(); else hasResults">
          <div class="no-results" *ngIf="showResults()">
            <app-empty-state
              icon="person_search"
              title="No matching employees found"
              message="Try adjusting your requirements or adding more skills."
            />
          </div>
        </ng-container>

        <ng-template #hasResults>
          <div class="results-section">
            <div class="results-header">
              <h2>Matching Employees ({{ matches().length }} found)</h2>
              <mat-form-field appearance="outline" class="sort-field">
                <mat-label>Sort by</mat-label>
                <mat-select [(ngModel)]="sortBy" (ngModelChange)="sortMatches()">
                  <mat-option value="totalScore">Best Match</mat-option>
                  <mat-option value="skillMatchScore">Skill Match</mat-option>
                  <mat-option value="competencyScore">Competency</mat-option>
                  <mat-option value="availabilityScore">Availability</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-card class="matches-table-card">
              <mat-card-content>
                <table mat-table [dataSource]="matches()" class="matches-table">

                  <ng-container matColumnDef="rank">
                    <th mat-header-cell *matHeaderCellDef>Rank</th>
                    <td mat-cell *matCellDef="let match; let i = index">
                      <span class="rank-badge">{{ i + 1 }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="employee">
                    <th mat-header-cell *matHeaderCellDef>Employee</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="employee-info">
                        <strong>{{ match.employee.username }}</strong>
                        <span class="employee-meta">{{ match.employee.departmentName }} • {{ match.employee.positionTitle }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="totalScore">
                    <th mat-header-cell *matHeaderCellDef>Total Score</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="score-display">
                        <span class="score-value" [class]="getScoreClass(match.totalScore)">{{ match.totalScore }}</span>
                        <mat-progress-bar mode="determinate" [value]="match.totalScore" [color]="getScoreColor(match.totalScore)"></mat-progress-bar>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="skillMatch">
                    <th mat-header-cell *matHeaderCellDef>Skill Match</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="score-breakdown">
                        <span class="score-label">Skill Match</span>
                        <span class="score-value">{{ match.skillMatchScore }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="match.skillMatchScore" color="primary"></mat-progress-bar>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="competency">
                    <th mat-header-cell *matHeaderCellDef>Competency</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="score-breakdown">
                        <span class="score-label">Competency</span>
                        <span class="score-value">{{ match.competencyScore }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="match.competencyScore" color="accent"></mat-progress-bar>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="availability">
                    <th mat-header-cell *matHeaderCellDef>Availability</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="score-breakdown">
                        <span class="score-label">Availability</span>
                        <span class="score-value">{{ match.availabilityScore }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="match.availabilityScore" color="warn"></mat-progress-bar>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="skillsDetail">
                    <th mat-header-cell *matHeaderCellDef>Matching Skills</th>
                    <td mat-cell *matCellDef="let match">
                      <div class="skills-detail">
                        <div class="matching-skills">
                          <span class="section-label">Matched:</span>
                          <mat-chip-set>
                            <mat-chip *ngFor="let s of match.matchingSkills" class="matched-chip">
                              {{ s.skillName }} ({{ s.requiredLevel }})
                            </mat-chip>
                          </mat-chip-set>
                        </div>
                        <div class="missing-skills" *ngIf="match.missingSkills.length > 0">
                          <span class="section-label">Missing:</span>
                          <mat-chip-set>
                            <mat-chip *ngFor="let s of match.missingSkills" class="missing-chip">
                              {{ s.skillName }} ({{ s.requiredLevel }})
                            </mat-chip>
                          </mat-chip-set>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let match">
                      <button mat-stroked-button (click)="viewEmployeeProfile(match.employee)">
                        <mat-icon>person</mat-icon> View Profile
                      </button>
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

    .requirements-card { margin-bottom: 24px; padding: 20px !important; }
    .requirements-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .requirements-list h4 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .requirement-row { display: flex; gap: 12px; align-items: flex-end; margin-bottom: 12px; flex-wrap: wrap; }
    .skill-field { flex: 1; min-width: 200px; }
    .level-field { min-width: 150px; }
    .mandatory-checkbox { margin-top: 8px; }
    .add-req-btn { margin-top: 8px; }
    .search-btn { width: 100%; padding: 16px; font-size: 16px; }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .results-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .sort-field { min-width: 180px; }

    .matches-table-card { overflow-x: auto; }
    .matches-table { width: 100%; }
    th.mat-header-cell, td.mat-cell { padding: 12px 16px; vertical-align: middle; }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      font-weight: 700;
    }

    .employee-info { display: flex; flex-direction: column; gap: 2px; }
    .employee-meta { font-size: 12px; color: var(--color-text-muted); }

    .score-display { display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
    .score-value {
      font-weight: 700;
      font-size: 14px;
    }
    .score-value.high { color: #16A34A; }
    .score-value.medium { color: #D97706; }
    .score-value.low { color: #DC2626; }
    .score-display ::ng-deep .mat-mdc-progress-bar { height: 6px; border-radius: 3px; }

    .score-breakdown { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
    .score-label { color: var(--color-text-muted); }
    .score-value { font-weight: 600; }
    td.mat-cell ::ng-deep .mat-mdc-progress-bar { height: 6px; border-radius: 3px; }

    .skills-detail { display: flex; flex-direction: column; gap: 8px; min-width: 250px; }
    .section-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
    .matched-chip { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .missing-chip { background: rgba(220, 38, 38, 0.15); color: #DC2626; }

    @media (max-width: 900px) {
      .matches-table { min-width: 900px; }
      .requirement-row { flex-direction: column; align-items: stretch; }
      .skill-field, .level-field { width: 100%; }
    }
  `],
})
export class EmployeeMatchingComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private skillService = inject(SkillService);

  searching = signal(false);
  showResults = signal(false);
  matches = signal<EmployeeMatch[]>([]);
  sortBy: string = 'totalScore';

  projectName: string = '';
  requirements: SkillRequirement[] = [];
  availableSkills: Skill[] = [];

  displayedColumns = ['rank', 'employee', 'totalScore', 'skillMatch', 'competency', 'availability', 'skillsDetail', 'actions'];

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.skillService.getAll().subscribe({
      next: (skills) => {
        this.availableSkills = skills;
      },
      error: (err) => console.error('Failed to load skills', err),
    });
  }

  addRequirement(): void {
    this.requirements.push({
      skillId: 0,
      skillName: '',
      category: '',
      requiredLevel: 'INTERMEDIATE',
      mandatory: true,
    });
  }

  removeRequirement(index: number): void {
    this.requirements.splice(index, 1);
  }

  findMatches(): void {
    if (this.requirements.length === 0) return;

    this.searching.set(true);
    this.showResults.set(false);

    this.employeeService.getAll().subscribe({
      next: (employees) => {
        this.computeMatches(employees);
        this.searching.set(false);
        this.showResults.set(true);
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.searching.set(false);
      },
    });
  }

  computeMatches(employees: Employee[]): void {
    const matches: EmployeeMatch[] = [];

    employees.forEach(emp => {
      this.employeeService.getSkills(emp.id).subscribe({
        next: (skills) => {
          const match = this.calculateMatch(emp, skills);
          matches.push(match);
          // Sort by the current sort criteria
          this.sortMatchesInternal(matches);
          this.matches.set([...matches]);
        },
        error: (err) => console.error('Failed to load employee skills', err),
      });
    });
  }

  calculateMatch(employee: Employee, skills: EmployeeSkill[]): EmployeeMatch {
    let skillMatch = 0;
    let competency = 0;
    const matchingSkills: SkillRequirement[] = [];
    const missingSkills: SkillRequirement[] = [];

    this.requirements.forEach(req => {
      const skill = skills.find(s => s.skillId === req.skillId);
      const skillData = this.availableSkills.find(s => s.id === req.skillId);

      if (skill) {
        // Has the skill
        skillMatch += 1;
        matchingSkills.push({
          ...req,
          skillName: skillData?.name || skill.skillName,
        });

        // Calculate competency score
        const currentLevel = this.getLevelIndex(skill.level);
        const requiredLevel = this.getLevelIndex(req.requiredLevel);
        if (currentLevel >= requiredLevel) {
          competency += 1;
        } else {
          competency += currentLevel / requiredLevel;
        }
      } else {
        // Missing skill
        missingSkills.push({
          ...req,
          skillName: skillData?.name || '',
        });
      }
    });

    const skillMatchScore = this.requirements.length > 0
      ? Math.round((skillMatch / this.requirements.length) * 100)
      : 0;

    const competencyScore = this.requirements.length > 0
      ? Math.round((competency / this.requirements.length) * 100)
      : 0;

    const availabilityScore = this.getAvailabilityScore(employee);

    // Total score = skillMatch × 50 + competency × 30 + availability × 20
    const totalScore = Math.round(
      skillMatchScore * 0.5 +
      competencyScore * 0.3 +
      availabilityScore * 0.2
    );

    return {
      employee,
      skills,
      skillMatchScore,
      competencyScore,
      availabilityScore,
      totalScore,
      matchingSkills,
      missingSkills,
    };
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

  getAvailabilityScore(employee: Employee): number {
    // Based on employee availability field
    const availabilityMap: { [key: string]: number } = {
      'Available': 100,
      'Partially Available': 60,
      'Not Available': 0,
    };
    return availabilityMap[employee.availability] || 50;
  }

  sortMatches(): void {
    this.sortMatchesInternal(this.matches());
    this.matches.set([...this.matches()]);
  }

  sortMatchesInternal(matches: EmployeeMatch[]): void {
    matches.sort((a, b) => {
      if (this.sortBy === 'totalScore') return b.totalScore - a.totalScore;
      if (this.sortBy === 'skillMatchScore') return b.skillMatchScore - a.skillMatchScore;
      if (this.sortBy === 'competencyScore') return b.competencyScore - a.competencyScore;
      if (this.sortBy === 'availabilityScore') return b.availabilityScore - a.availabilityScore;
      return 0;
    });
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  getScoreColor(score: number): 'primary' | 'accent' | 'warn' {
    if (score >= 70) return 'primary';
    if (score >= 40) return 'accent';
    return 'warn';
  }

  viewEmployeeProfile(employee: Employee): void {
    console.log('View employee profile', employee);
  }
}