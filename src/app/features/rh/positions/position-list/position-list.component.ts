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
import { PositionService } from '../../../../core/services/position.service';
import { Position } from '../../../../domain/models/position.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import {
  PositionFormDialogComponent,
  PositionDialogData,
} from '../position-form-dialog/position-form-dialog.component';

@Component({
  selector: 'app-position-list',
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
        <h1>Positions</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Position
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search positions</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" (ngModelChange)="applyFilter()" placeholder="Search by title...">
      </mat-form-field>

      <!-- Position Cards Grid -->
      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && filteredPositions().length === 0) {
          <app-empty-state icon="work" title="No positions found" message="Try adjusting your search or create a new position." />
        } @else {
          <div class="cards-grid">
            @for (pos of filteredPositions(); track pos.id) {
              <mat-card class="pos-card">
                <mat-card-header>
                  <mat-card-title>{{ pos.title }}</mat-card-title>
                </mat-card-header>
                <mat-card-actions>
                  <button mat-stroked-button color="primary" (click)="openDialog(pos)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-stroked-button color="warn" (click)="delete(pos)">
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

    .pos-card {
      height: 100%;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .pos-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    .pos-card mat-card-header { margin-bottom: 8px; }
    .pos-card mat-card-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .pos-card mat-card-subtitle {
      font-size: 12px;
      color: var(--color-text-muted);
    }
    .pos-card mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
    }

    @media (max-width: 640px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class PositionListComponent implements OnInit {
  private service = inject(PositionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  positions = signal<Position[]>([]);
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
        this.positions.set(data);
        this.loading.set(false);
      });
  }

  filteredPositions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.positions();
    return this.positions().filter(p => p.title.toLowerCase().includes(term));
  });

  applyFilter(): void {
    // Trigger recomputation
  }

  openDialog(position?: Position): void {
    this.dialog
      .open(PositionFormDialogComponent, {
        width: '420px',
        data: { position } as PositionDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          position ? this.service.update(position.id, form) : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(position ? 'Position updated' : 'Position created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(position: Position): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Position',
          message: `Delete "${position.title}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(position.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Position deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}