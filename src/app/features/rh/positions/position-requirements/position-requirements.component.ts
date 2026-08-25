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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SkillService } from '../../../../core/services/skill.service';
import { Skill, SkillCategory } from '../../../../domain/models/skill.model';
import { SkillLevel } from '../../../../domain/models/employee-skill.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

interface PositionRequirement {
  id: number;
  positionId: number;
  positionTitle: string;
  skillId: number;
  skillName: string;
  skillCategory: string;
  requiredLevel: SkillLevel;
  mandatory: boolean;
}

interface CreateRequirementData {
  positionId: number;
  skillId: number;
  requiredLevel: SkillLevel;
  mandatory: boolean;
}

@Component({
  selector: 'app-position-requirements',
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
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressBarModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Position Skill Requirements</h1>
        <p class="subtitle">Define required skills and competency levels for each position</p>
      </div>

      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Position</mat-label>
          <mat-select [(ngModel)]="selectedPosition" (ngModelChange)="onFilterChange()">
            <mat-option value="">All Positions</mat-option>
            <mat-option *ngFor="let pos of positions" [value]="pos.id">{{ pos.title }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Skill Category</mat-label>
          <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()">
            <mat-option value="">All Categories</mat-option>
            <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Mandatory Only</mat-label>
          <mat-select [(ngModel)]="mandatoryOnly" (ngModelChange)="onFilterChange()">
            <mat-option value="false">All</mat-option>
            <mat-option value="true">Mandatory Only</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="openCreateDialog()" class="create-btn">
          <mat-icon>add</mat-icon> Add Requirement
        </button>
      </div>

      <div style="position: relative;">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        <ng-container *ngIf="!loading() && filteredRequirements.length === 0; else hasRequirements">
          <app-empty-state
            icon="assignment_ind"
            title="No position requirements defined"
            message="Create position skill requirements to define what skills are needed for each role."
          />
        </ng-container>

        <ng-template #hasRequirements>
          <mat-card class="requirements-table-card">
            <mat-card-header>
              <mat-card-title>Position Skill Requirements</mat-card-title>
              <mat-card-subtitle>{{ filteredRequirements.length }} requirements defined</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="filteredRequirements" class="requirements-table">

                <ng-container matColumnDef="positionTitle">
                  <th mat-header-cell *matHeaderCellDef>Position</th>
                  <td mat-cell *matCellDef="let req">{{ req.positionTitle }}</td>
                </ng-container>

                <ng-container matColumnDef="skillName">
                  <th mat-header-cell *matHeaderCellDef>Required Skill</th>
                  <td mat-cell *matCellDef="let req">
                    <mat-chip [class]="'category-' + req.skillCategory.toLowerCase().replace(' ', '-')">
                      {{ req.skillCategory }}
                    </mat-chip>
                    {{ req.skillName }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="requiredLevel">
                  <th mat-header-cell *matHeaderCellDef>Required Level</th>
                  <td mat-cell *matCellDef="let req">
                    <mat-chip [class]="'level-' + req.requiredLevel.toLowerCase()">
                      {{ req.requiredLevel }}
                    </mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="mandatory">
                  <th mat-header-cell *matHeaderCellDef>Mandatory</th>
                  <td mat-cell *matCellDef="let req">
                    <mat-icon [fontIcon]="req.mandatory ? 'check_circle' : 'radio_button_unchecked'"
                              [class]="req.mandatory ? 'text-success' : 'text-muted'">
                    </mat-icon>
                    {{ req.mandatory ? 'Yes' : 'No' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let req">
                    <button mat-icon-button [matMenuTriggerFor]="menu">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="openEditDialog(req)">
                        <mat-icon>edit</mat-icon> Edit
                      </button>
                      <button mat-menu-item (click)="deleteRequirement(req)">
                        <mat-icon color="warn">delete</mat-icon> Delete
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Summary by Position -->
          <mat-card class="summary-card" *ngIf="selectedPosition">
            <mat-card-header>
              <mat-card-title>Requirement Summary for {{ getSelectedPositionTitle() }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value">{{ positionRequirements().length }}</div>
                  <div class="summary-label">Total Requirements</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ positionRequirements().filter(r => r.mandatory).length }}</div>
                  <div class="summary-label">Mandatory</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ positionRequirements().filter(r => !r.mandatory).length }}</div>
                  <div class="summary-label">Preferred</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">{{ getCategoriesCount() }}</div>
                  <div class="summary-label">Skill Categories</div>
                </div>
              </div>

              <div class="level-distribution">
                <h4>Required Level Distribution</h4>
                <div class="level-bars">
                  <div class="level-bar" *ngFor="let level of levelOrder">
                    <span class="level-name">{{ level }}</span>
                    <div class="level-bar-container">
                      <mat-progress-bar mode="determinate"
                        [value]="getLevelPercentage(level)"
                        [color]="getLevelColor(level)">
                      </mat-progress-bar>
                      <span class="level-count">{{ getLevelCount(level) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-muted); font-size: 13px; margin: 4px 0 0; }

    .filters-row {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .filter-field { min-width: 200px; flex: 1; }
    .create-btn { margin-left: auto; }

    .requirements-table-card { overflow-x: auto; }
    .requirements-table { width: 100%; }
    th.mat-header-cell, td.mat-cell { padding: 12px 16px; }

    .category-technical { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .category-soft-skill { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .category-management { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .category-language { background: rgba(255, 152, 0, 0.15); color: #FF9800; }
    .category-certification { background: rgba(153, 28, 28, 0.15); color: #991C1C; }
    .category-domain { background: rgba(103, 58, 183, 0.15); color: #673ABD; }

    .level-beginner { background: rgba(107, 114, 128, 0.15); color: #6B7280; }
    .level-intermediate { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .level-advanced { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .level-expert { background: rgba(22, 163, 74, 0.15); color: #16A34A; }

    .summary-card { margin-top: 24px; padding: 20px !important; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-item { text-align: center; padding: 16px; }
    .summary-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
    .summary-label { font-size: 12px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

    .level-distribution h4 { margin: 0 0 16px; font-size: 14px; font-weight: 600; }
    .level-bars { display: flex; flex-direction: column; gap: 8px; }
    .level-bar { display: flex; align-items: center; gap: 12px; }
    .level-name { width: 100px; font-size: 12px; font-weight: 500; }
    .level-bar-container { flex: 1; display: flex; align-items: center; gap: 8px; }
    .level-bar-container ::ng-deep .mat-mdc-progress-bar { height: 6px; border-radius: 3px; flex: 1; }
    .level-count { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); width: 30px; }

    .text-success { color: #16A34A; }
    .text-muted { color: var(--color-text-muted); }

    @media (max-width: 768px) {
      .requirements-table { min-width: 700px; }
      .filters-row { flex-direction: column; align-items: stretch; }
      .filter-field { width: 100%; }
      .create-btn { width: 100%; }
    }
  `],
})
export class PositionRequirementsComponent implements OnInit {
  private skillService = inject(SkillService);
  private dialog = inject(MatDialog);

  loading = signal(true);

  positions: { id: number; title: string }[] = [];
  requirements: PositionRequirement[] = [];
  filteredRequirements: PositionRequirement[] = [];

  selectedPosition: string = '';
  selectedCategory: string = '';
  mandatoryOnly: string = 'false';

  categories: string[] = [
    SkillCategory.Technical,
    SkillCategory.SoftSkill,
    SkillCategory.Management,
    SkillCategory.Language,
    SkillCategory.Certification,
    SkillCategory.Domain,
  ];

  levelOrder: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  displayedColumns = ['positionTitle', 'skillName', 'requiredLevel', 'mandatory', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    // Load positions and requirements
    // This would call the actual API
    this.positions = [
      { id: 1, title: 'Software Engineer' },
      { id: 2, title: 'Senior Software Engineer' },
      { id: 3, title: 'Team Lead' },
      { id: 4, title: 'Engineering Manager' },
    ];

    // Mock data for demonstration
    this.requirements = [
      { id: 1, positionId: 1, positionTitle: 'Software Engineer', skillId: 1, skillName: 'Java', skillCategory: 'Technical', requiredLevel: 'INTERMEDIATE', mandatory: true },
      { id: 2, positionId: 1, positionTitle: 'Software Engineer', skillId: 2, skillName: 'SQL', skillCategory: 'Technical', requiredLevel: 'INTERMEDIATE', mandatory: true },
      { id: 3, positionId: 1, positionTitle: 'Software Engineer', skillId: 3, skillName: 'Communication', skillCategory: 'Soft Skill', requiredLevel: 'BEGINNER', mandatory: false },
      { id: 4, positionId: 2, positionTitle: 'Senior Software Engineer', skillId: 1, skillName: 'Java', skillCategory: 'Technical', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 5, positionId: 2, positionTitle: 'Senior Software Engineer', skillId: 2, skillName: 'SQL', skillCategory: 'Technical', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 6, positionId: 2, positionTitle: 'Senior Software Engineer', skillId: 4, skillName: 'System Design', skillCategory: 'Technical', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 7, positionId: 3, positionTitle: 'Team Lead', skillId: 1, skillName: 'Java', skillCategory: 'Technical', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 8, positionId: 3, positionTitle: 'Team Lead', skillId: 5, skillName: 'Team Management', skillCategory: 'Management', requiredLevel: 'INTERMEDIATE', mandatory: true },
      { id: 9, positionId: 3, positionTitle: 'Team Lead', skillId: 3, skillName: 'Communication', skillCategory: 'Soft Skill', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 10, positionId: 4, positionTitle: 'Engineering Manager', skillId: 5, skillName: 'Team Management', skillCategory: 'Management', requiredLevel: 'EXPERT', mandatory: true },
      { id: 11, positionId: 4, positionTitle: 'Engineering Manager', skillId: 6, skillName: 'Strategic Planning', skillCategory: 'Management', requiredLevel: 'ADVANCED', mandatory: true },
      { id: 12, positionId: 4, positionTitle: 'Engineering Manager', skillId: 3, skillName: 'Communication', skillCategory: 'Soft Skill', requiredLevel: 'EXPERT', mandatory: true },
    ];

    this.filteredRequirements = this.requirements;
    this.loading.set(false);
  }

  onFilterChange(): void {
    this.filteredRequirements = this.requirements.filter(req => {
      if (this.selectedPosition && req.positionId !== +this.selectedPosition) return false;
      if (this.selectedCategory && req.skillCategory !== this.selectedCategory) return false;
      if (this.mandatoryOnly === 'true' && !req.mandatory) return false;
      return true;
    });
  }

  positionRequirements = signal<PositionRequirement[]>([]);

  getSelectedPositionTitle(): string {
    const pos = this.positions.find(p => p.id === +this.selectedPosition);
    return pos?.title || '';
  }

  getCategoriesCount(): number {
    const reqs = this.positionRequirements();
    return new Set(reqs.map(r => r.skillCategory)).size;
  }

  getLevelPercentage(level: SkillLevel): number {
    const reqs = this.positionRequirements();
    if (reqs.length === 0) return 0;
    const count = reqs.filter(r => r.requiredLevel === level).length;
    return (count / reqs.length) * 100;
  }

  getLevelCount(level: SkillLevel): number {
    return this.positionRequirements().filter(r => r.requiredLevel === level).length;
  }

  getLevelColor(level: SkillLevel): 'primary' | 'accent' | 'warn' {
    switch (level) {
      case 'BEGINNER': return 'primary';
      case 'INTERMEDIATE': return 'accent';
      case 'ADVANCED': return 'warn';
      case 'EXPERT': return 'primary';
    }
  }

  openCreateDialog(): void {
    console.log('Open create requirement dialog');
  }

  openEditDialog(req: PositionRequirement): void {
    console.log('Open edit requirement dialog', req);
  }

  deleteRequirement(req: PositionRequirement): void {
    console.log('Delete requirement', req);
  }
}