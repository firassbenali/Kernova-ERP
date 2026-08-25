import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { DepartmentService } from '../../../../core/services/department.service';
import { Department } from '../../../../domain/models/department.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import {
  DepartmentFormDialogComponent,
  DepartmentDialogData,
} from '../department-form-dialog/department-form-dialog.component';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Departments</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Department
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search departments</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" (ngModelChange)="applyFilter()" placeholder="Search by name...">
      </mat-form-field>

      <!-- Department Cards Grid -->
      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && filteredDepartments().length === 0) {
          <app-empty-state
            icon="account_tree"
            title="No departments found"
            message="Try adjusting your search or create a new department." />
        } @else {
          <div class="cards-grid">
            @for (dept of filteredDepartments(); track dept.id) {
              <mat-card class="dept-card">
                <mat-card-header>
                  <mat-card-title>{{ dept.name }}</mat-card-title>
                </mat-card-header>
                <mat-card-actions>
                  <button mat-stroked-button color="primary" (click)="openDialog(dept)">
                    <mat-icon>edit</mat-icon> 
                  </button>
                  <button mat-stroked-button color="warn" (click)="delete(dept)">
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

    .search-field { width: 100%; max-width: 400px; margin-bottom: 20px; }

    .section-card { overflow: hidden; }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .dept-card {
      height: 100%;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .dept-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .dept-card mat-card-header { margin-bottom: 8px; }
    .dept-card mat-card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .dept-card mat-card-subtitle {
      font-size: 12px;
      color: var(--color-text-muted);
    }
    .dept-card mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
    }

    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DepartmentListComponent implements OnInit {
  private service = inject(DepartmentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  departments = signal<Department[]>([]);
  searchTerm = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.departments.set(data);
        this.loading.set(false);
      });
  }

  filteredDepartments = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.departments();
    return this.departments().filter(d => d.name.toLowerCase().includes(term));
  });

  applyFilter(): void {
    // Trigger recomputation - not needed with signals, but kept for compatibility
  }

  openDialog(department?: Department): void {
    this.dialog
      .open(DepartmentFormDialogComponent, {
        width: '420px',
        data: { department } as DepartmentDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          department
            ? this.service.update(department.id, form)
            : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(department ? 'Department updated' : 'Department created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(department: Department): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Department',
          message: `Delete "${department.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(department.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Department deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}