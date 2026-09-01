import { Component, EventEmitter, OnInit, Output, computed, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatBadgeModule, MatDividerModule
  ],
  template: `
    <mat-toolbar class="topbar">
      <!-- Left: menu toggle -->
      <button mat-icon-button class="topbar__menu-btn" (click)="menuToggle.emit()" aria-label="Toggle navigation">
        <mat-icon>menu</mat-icon>
      </button>

      <!-- Page title slot -->
      <span class="topbar__spacer"></span>

      <!-- Right actions -->
      <div class="topbar__actions">
        <!-- Notifications bell: marks all read then navigates -->
        <button mat-icon-button
          (click)="openNotifications()"
          [matBadge]="unreadCount() > 0 ? unreadCount().toString() : null"
          matBadgeColor="warn"
          matBadgeSize="small"
          aria-label="Notifications">
          <mat-icon>notifications_none</mat-icon>
        </button>

        <!-- User menu -->
        <button mat-button [matMenuTriggerFor]="userMenu" class="topbar__user-btn">
          <div class="user-avatar">
            {{ userInitial() }}
          </div>
          <span class="topbar__username">{{ userName() }}</span>
          <mat-icon>expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" xPosition="before" class="user-menu">
          <div class="user-menu-header">
            <div class="user-avatar user-avatar--lg">{{ userInitial() }}</div>
            <div>
              <div class="user-menu-name">{{ userName() }}</div>
              <div class="user-menu-email">{{ userEmail() }}</div>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign out</span>
          </button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--topbar-height);
      background: var(--color-surface) !important;
      border-bottom: 1px solid var(--color-border-light);
      padding: 0 16px 0 8px;
      box-shadow: var(--shadow-sm);
      color: var(--color-text-primary) !important;
    }

    .topbar__menu-btn {
      color: var(--color-text-secondary);
      margin-right: 8px;
    }

    .topbar__spacer { flex: 1; }

    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .topbar__user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;

      &--lg {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }
    }

    .topbar__username {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .user-menu-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .user-menu-email {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
  `]
})
export class TopbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private router = inject(Router);

  /** Reactively tracks unread count — updates when notifications are fetched or marked read */
  readonly unreadCount = toSignal(this.notifService.unreadCount$, { initialValue: 0 });

  readonly userName = computed(() => this.authService.currentUser()?.username ?? 'User');
  readonly userEmail = computed(() => this.authService.currentUser()?.email ?? '');
  readonly userInitial = computed(() => {
    const name = this.authService.currentUser()?.username ?? 'U';
    return name.charAt(0).toUpperCase();
  });

  ngOnInit(): void {
    // Fetch once on init to populate the badge count
    this.notifService.getAll().subscribe();
  }

  openNotifications(): void {
    // Fetch latest notifications, mark all unread as read, then navigate
    this.notifService.getAll().subscribe(list => {
      const unread = list.filter(n => !n.read);
      if (unread.length > 0) {
        const requests = unread.map(n =>
          this.notifService.markAsRead(n.idNotification).pipe(catchError(() => of(null)))
        );
        forkJoin(requests).subscribe(() => {
          this.notifService.setUnreadCount(0);
          this.router.navigate(['/notifications']);
        });
      } else {
        this.router.navigate(['/notifications']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
