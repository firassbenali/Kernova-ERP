import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { UserResponse } from '../../../domain/models/user.model';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import {
  UserFormDialogComponent,
  UserDialogData,
} from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSortModule,
    StatusChipComponent,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Users</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add User
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state
            icon="person"
            title="No users"
            message="Create your first user to manage access to the platform." />
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let row">{{ row.id }}</td>
            </ng-container>
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Username</th>
              <td mat-cell *matCellDef="let row">{{ row.username }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.role ?? '—'"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.status"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="openDialog(row)">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-menu-item (click)="toggleStatus(row)">
                    <mat-icon>{{ row.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                    {{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                  </button>
                  <button mat-menu-item (click)="delete(row)">
                    <mat-icon color="warn">delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  private service = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<UserResponse>([]);
  columns = ['id', 'username', 'email', 'role', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.loading.set(false);
      });
  }

  openDialog(user?: UserResponse): void {
    this.dialog
      .open(UserFormDialogComponent, {
        width: '440px',
        data: { user } satisfies UserDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => (user ? this.service.update(user.id, form) : this.service.create(form)))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(user ? 'User updated' : 'User created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  toggleStatus(user: UserResponse): void {
    const target = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: target === 'ACTIVE' ? 'Activate User' : 'Deactivate User',
          message:
            target === 'ACTIVE'
              ? `Re-enable "${user.username}"? They will be able to sign in again.`
              : `Deactivate "${user.username}"? They will no longer be able to sign in.`,
          confirmLabel: target === 'ACTIVE' ? 'Activate' : 'Deactivate',
          danger: target !== 'ACTIVE',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.changeStatus(user.id, target))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`User ${target === 'ACTIVE' ? 'activated' : 'deactivated'}`, 'OK', {
            duration: 3000,
          });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(user: UserResponse): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete User',
          message: `Delete "${user.username}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(user.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('User deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
