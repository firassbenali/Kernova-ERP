import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { SkillService } from '../../../../core/services/skill.service';
import { Skill } from '../../../../domain/models/skill.model';
import { SkillCategory } from '../../../../domain/models/skill.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-skill-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
  ],
  template: `
    <mat-card class="skill-card">
      <mat-card-header>
        <mat-card-title>Skill Catalog</mat-card-title>
        <mat-card-subtitle>Manage and search skill catalog</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search skills</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput (keyup)="onSearch($event.target.value)" placeholder="Search by name or category...">
        </mat-form-field>

        <mat-select [(ngModel)]="selectedCategory" (ngModelChange)="onCategoryChange()"
                    placeholder="Filter by category">
          <mat-option value="">
            <mat-label>All Categories</mat-label>
          </mat-option>
          <mat-option *ngFor="let category of categories" [value]="category">
            <mat-icon [fontIcon]="getCategoryIcon(category)"></mat-icon>
            {{ category }}
          </mat-option>
        </mat-select>

        <div class="skills-table-wrapper">
          <table mat-table [dataSource]="filteredSkills" matSort>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let skill">
                <mat-icon [fontIcon]="getCategoryIcon(skill.category)" class="skill-icon"></mat-icon>
                <a [routerLink]="['/rh/skills', skill.id]" class="skill-name-link">
                  {{ skill.name }}
                </a>
              </td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let skill">
                <span class="badge-category {{ getCategoryClass(skill.category) }}">
                  {{ skill.category | uppercase }}
                </span>
              </td>
            </ng-container>

            <!-- Description Column -->
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let skill">
                <small>{{ skill.description || 'No description' }}</small>
              </td>
            </ng-container>

            <!-- Active Column -->
            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Active</th>
              <td mat-cell *matCellDef="let skill">
                <mat-icon [fontIcon]="skill.active ? 'check_circle' : 'cancel'"
                          [class]="skill.active ? 'text-success' : 'text-danger'">
                </mat-icon>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let skill">
                <mat-icon mat-icon-button title="Edit"
                        [routerLink]="['/rh/skills', skill.id, 'edit']">
                </mat-icon>
                <mat-icon mat-icon-button title="Delete"
                        (click)="deleteSkill(skill.id)">
                </mat-icon>
              </td>
            </ng-container>

          </table>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .skill-card { width: 100%; }
    .search-field { margin-bottom: 16px; }
    .skills-table-wrapper { height: 400px; overflow: auto; }
    mat-table { width: 100%; }
    th.mat-header-cell, td.mat-cell { padding: 8px 12px; }
    .skill-icon { font-size: 20px; margin-right: 8px; }
    .skill-name-link { color: var(--color-primary); text-decoration: none; }
    .skill-name-link:hover { text-decoration: underline; }
    .badge-category {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-category.Technical { background: rgba(27, 58, 107, 0.15); color: #1B3A6B; }
    .badge-category.Soft-Skill { background: rgba(22, 163, 74, 0.15); color: #16A34A; }
    .badge-category.Management { background: rgba(156, 39, 176, 0.15); color: #9C27B0; }
    .badge-category.Language { background: rgba(255, 152, 0, 0.15); color: #FF9800; }
    .badge-category.Certification { background: rgba(153, 28, 28, 0.15); color: #991C1C; }
    .badge-category.Domain { background: rgba(103, 58, 183, 0.15); color: #673ABD; }
    mat-select { min-width: 200px; }
  `],
})
export class SkillCatalogComponent implements OnInit {
  private skillService = inject(SkillService);
  private destroy$ = new Subject<void>();

  skills: Skill[] = [];
  filteredSkills: Skill[] = [];
  selectedCategory: string = '';
  categories: string[] = [
    SkillCategory.Technical,
    SkillCategory.SoftSkill,
    SkillCategory.Management,
    SkillCategory.Language,
    SkillCategory.Certification,
    SkillCategory.Domain,
  ];

  ngOnInit(): void {
    this.loadSkills();
  }

  loadSkills(): void {
    this.skillService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (skills: Skill[]) => {
        this.skills = skills;
        this.filteredSkills = skills;
      },
      error: (err: unknown) => console.error('Failed to load skills', err),
    });
  }

  onSearch(value: string): void {
    const term = value.toLowerCase();
    this.filteredSkills = this.skills.filter(
      skill => skill.name.toLowerCase().includes(term) ||
               (skill.description && skill.description.toLowerCase().includes(term))
    );
  }

  onCategoryChange(): void {
    if (this.selectedCategory) {
      this.filteredSkills = this.skills.filter(
        skill => skill.category === this.selectedCategory
      );
    } else {
      this.filteredSkills = this.skills;
    }
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      [SkillCategory.Technical]: 'computer',
      [SkillCategory.SoftSkill]: 'people',
      [SkillCategory.Management]: 'group',
      [SkillCategory.Language]: 'language',
      [SkillCategory.Certification]: 'trending_up',
      [SkillCategory.Domain]: 'domain',
    };
    return iconMap[category] || 'category';
  }

  getCategoryClass(category: string): string {
    return `badge-category-${category.replace(/ /g, '-').toLowerCase()}`;
  }

  deleteSkill(skillId: number): void {
    if (confirm('Are you sure you want to delete this skill?')) {
      this.skillService.delete(skillId).subscribe({
        next: () => {
          this.loadSkills();
        },
        error: (err: unknown) => console.error('Failed to delete skill', err),
      });
    }
  }
}