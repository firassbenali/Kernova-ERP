import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SkillService } from '../../../../core/services/skill.service';
import { Skill, SkillCategory } from '../../../../domain/models/skill.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { SkillFormDialogComponent, SkillDialogData } from '../skill-form-dialog/skill-form-dialog.component';

@Component({
  selector: 'app-skill-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Skills</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Skill
          </button>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search skills</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" (ngModelChange)="applyFilter()" placeholder="Search by name or category...">
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Category</mat-label>
          <mat-select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)" (ngModelChange)="applyFilter()">
            <mat-option value="">All Categories</mat-option>
            @for (cat of categories; track cat) {
              <mat-option [value]="cat">{{ cat }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="activeFilter()" (ngModelChange)="activeFilter.set($event)" (ngModelChange)="applyFilter()">
            <mat-option value="">All</mat-option>
            <mat-option [value]="true">Active</mat-option>
            <mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Skill Cards Grid -->
      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && filteredSkills().length === 0) {
          <app-empty-state icon="psychology" title="No skills found" message="Try adjusting your filters or create a new skill." />
        } @else {
          <div class="cards-grid">
            @for (skill of filteredSkills(); track skill.id) {
              <mat-card class="skill-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-chip [class]="'category-' + skill.category.toLowerCase().replace(' ', '-')">
                      {{ skill.name }}
                    </mat-chip>
                  </mat-card-title>
                  <mat-card-subtitle>{{ skill.category }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p class="skill-desc">{{ skill.description || 'No description' }}</p>
                  <div class="skill-meta">
                    <span class="status-badge" [class.active]="skill.active" [class.inactive]="!skill.active">
                      <mat-icon>{{ skill.active ? 'check_circle' : 'cancel' }}</mat-icon>
                      {{ skill.active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-stroked-button color="primary" (click)="openDialog(skill)">
                    <mat-icon>edit</mat-icon> 
                  </button>
                  <button mat-stroked-button color="warn" (click)="delete(skill)">
                    <mat-icon>delete</mat-icon> 
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-header-actions { display: flex; gap: 12px; }

    .filter-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 250px; max-width: 400px; }
    .filter-field { min-width: 180px; }

    .section-card { overflow: hidden; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .skill-card {
      height: 100%;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .skill-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .skill-card mat-card-header { margin-bottom: 8px; }
    .skill-card mat-card-title { font-size: 15px; }
    .skill-card mat-card-subtitle {
      font-size: 12px;
      color: var(--color-text-muted);
      text-transform: capitalize;
    }
    .skill-desc {
      margin: 8px 0;
      color: var(--color-text-secondary);
      font-size: 13px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .skill-meta { display: flex; gap: 8px; margin-top: 8px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-badge.active { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .status-badge.inactive { background: rgba(220, 38, 38, 0.15); color: #DC2626; }
    .skill-card mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
    }

    .category-technical { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .category-soft-skill { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .category-management { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .category-language { background: rgba(255, 152, 0, 0.15); color: #FF9800; }
    .category-certification { background: rgba(153, 28, 28, 0.15); color: #991C1C; }
    .category-domain { background: rgba(103, 58, 183, 0.15); color: #673ABD; }

    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: 1fr; }
      .filter-bar { flex-direction: column; }
      .search-field, .filter-field { width: 100%; }
    }
  `],
})
export class SkillListComponent implements OnInit {
  private service = inject(SkillService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  skills = signal<Skill[]>([]);

  searchTerm = signal('');
  categoryFilter = signal('');
  activeFilter = signal('');

  categories = [
    SkillCategory.Technical,
    SkillCategory.SoftSkill,
    SkillCategory.Management,
    SkillCategory.Language,
    SkillCategory.Certification,
    SkillCategory.Domain,
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.skills.set(data);
        this.loading.set(false);
      });
  }

  filteredSkills = computed(() => {
    let data = this.skills();
    const term = this.searchTerm().toLowerCase().trim();

    if (term) {
      data = data.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }
    if (this.categoryFilter()) {
      data = data.filter(s => s.category === this.categoryFilter());
    }
    if (this.activeFilter() !== '') {
      data = data.filter(s => s.active === (this.activeFilter() === 'true'));
    }
    return data;
  });

  applyFilter(): void {
    // Trigger recomputation
  }

  getCategoryClass(category: string): string {
    return `badge-category-${category.replace(/ /g, '-')}`;
  }

  openDialog(skill?: Skill): void {
    this.dialog
      .open(SkillFormDialogComponent, {
        width: '450px',
        data: { skill } as SkillDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => (skill ? this.service.update(skill.id, form) : this.service.create(form)))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(skill ? 'Skill updated' : 'Skill created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(skill: Skill): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Skill',
          message: `Delete "${skill.name}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(skill.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Skill deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}