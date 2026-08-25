import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../domain/models/notification.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Notifications</h1>
      </div>

      <div class="section-card" style="position: relative">
        <div class="filter-bar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Filter by type</mat-label>
            <mat-select [value]="typeFilter" (selectionChange)="onTypeChange($event.value)">
              <mat-option value="">All</mat-option>
              @for (t of types; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && filtered().length === 0) {
          <app-empty-state icon="notifications_none" title="No notifications" message="You're all caught up." />
        } @else {
          <div class="notif-list">
            @for (n of filtered(); track n.idNotification) {
              <div class="notif-item" [class.notif-item--unread]="!n.isRead">
                <div class="notif-item__body">
                  <div class="notif-item__title">
                    {{ n.title }}
                    @if (n.type) {
                      <span class="notif-item__type">{{ n.type }}</span>
                    }
                  </div>
                  <div class="notif-item__msg">{{ n.message }}</div>
                  <div class="notif-item__date">{{ n.createdAt }}</div>
                </div>
                <div class="notif-item__actions">
                  @if (!n.isRead) {
                    <button mat-icon-button (click)="markAsRead(n)" title="Mark as read">
                      <mat-icon>check</mat-icon>
                    </button>
                  }
                  <button mat-icon-button (click)="delete(n)" title="Delete">
                    <mat-icon color="warn">delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--color-border-light);

      .mat-mdc-form-field { min-width: 220px; }
    }

    .notif-list { max-height: 70vh; overflow-y: auto; }

    .notif-item {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);

      &--unread {
        background: rgba(27, 58, 107, 0.04);
        border-left: 3px solid var(--color-primary);
      }
    }

    .notif-item__body { flex: 1; min-width: 0; }

    .notif-item__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--color-text-primary);
    }

    .notif-item__type {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 20px;
      background: var(--color-surface-alt);
      color: var(--color-text-secondary);
    }

    .notif-item__msg {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }

    .notif-item__date {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .notif-item__actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
  `],
})
export class NotificationsComponent implements OnInit {
  private service = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(true);
  all: Notification[] = [];
  filtered = signal<Notification[]>([]);
  typeFilter = '';
  types: string[] = [];

  ngOnInit(): void {
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.all = data;
        this.types = [...new Set(data.map(n => n.type).filter(Boolean))] as string[];
        this.applyFilter();
        this.loading.set(false);
      });
  }

  applyFilter(): void {
    this.filtered.set(
      this.typeFilter ? this.all.filter(n => n.type === this.typeFilter) : [...this.all]
    );
  }

  onTypeChange(value: string): void {
    this.typeFilter = value ?? '';
    this.applyFilter();
  }

  markAsRead(n: Notification): void {
    this.service.markAsRead(n.idNotification).subscribe({
      next: () => {
        n.isRead = true;
        this.applyFilter();
      },
      error: () => this.snackBar.open('Failed to update notification', 'Dismiss', { duration: 4000 }),
    });
  }

  delete(n: Notification): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Notification',
          message: `Delete "${n.title}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(n.idNotification))
      )
      .subscribe({
        next: () => {
          this.all = this.all.filter(x => x.idNotification !== n.idNotification);
          this.applyFilter();
          this.snackBar.open('Notification deleted', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
