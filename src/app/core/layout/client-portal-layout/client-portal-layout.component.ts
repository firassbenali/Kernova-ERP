import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from '../../auth/auth.service';
import { ClientPortalService } from '../../services/client-portal.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../../domain/models/notification.model';
import { catchError, of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-client-portal-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
  ],
  template: `
    <div class="portal-wrapper">
      <!-- Portal Top Header Navbar -->
      <header class="portal-header">
        <div class="portal-container header-content">
          <!-- Brand -->
          <div class="brand">
            <div class="brand-badge">Client</div>
            <span class="brand-title">Espace Client <strong>Kernova</strong></span>
          </div>

          <!-- Horizontal Navigation -->
          <nav class="portal-nav">
            <a routerLink="/portal/dashboard" routerLinkActive="active-nav">
              <mat-icon>dashboard</mat-icon> Accueil
            </a>
            <a routerLink="/portal/appointments" routerLinkActive="active-nav">
              <mat-icon>event</mat-icon> Mes Rendez-vous
            </a>
            <a routerLink="/portal/quotes" routerLinkActive="active-nav">
              <mat-icon>request_quote</mat-icon> Mes Devis
            </a>
            <a routerLink="/portal/contracts" routerLinkActive="active-nav">
              <mat-icon>description</mat-icon> Mes Contrats
            </a>
            <a routerLink="/portal/invoices" routerLinkActive="active-nav">
              <mat-icon>receipt_long</mat-icon> Mes Factures
            </a>
            <a routerLink="/portal/projects" routerLinkActive="active-nav">
              <mat-icon>business_center</mat-icon> Mes Projets
            </a>
            <a routerLink="/portal/documents" routerLinkActive="active-nav">
              <mat-icon>folder_zip</mat-icon> Mes Documents
            </a>
          </nav>

          <!-- Right Side Actions: Notification Bell + User Menu -->
          <div class="user-menu">
            <!-- Client Notification Bell -->
            <button
              mat-icon-button
              [matMenuTriggerFor]="notifMenu"
              class="notif-btn"
              [matBadge]="unreadCount()"
              [matBadgeHidden]="unreadCount() === 0"
              matBadgeColor="warn"
            >
              <mat-icon>notifications</mat-icon>
            </button>

            <mat-menu #notifMenu="matMenu" class="notif-menu" (opened)="markAllAsRead()">
              <div class="notif-header">
                <strong>Mes Notifications</strong>
                <span class="text-xs text-muted">{{ unreadCount() }} non lues</span>
              </div>
              <mat-divider></mat-divider>

              @if (notifications().length === 0) {
                <div class="notif-empty">Aucune notification pour le moment.</div>
              } @else {
                <div class="notif-list">
                  @for (n of notifications(); track n.idNotification) {
                    <div class="notif-item" [class.unread]="!n.read" (click)="markRead(n)">
                      <mat-icon class="notif-ic" color="primary">notifications_active</mat-icon>
                      <div class="notif-body">
                        <strong class="notif-title">{{ n.title }}</strong>
                        <p class="notif-msg">{{ n.message }}</p>
                        <span class="notif-time">{{ n.createdAt }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-menu>

            <!-- User Menu -->
            <button mat-button [matMenuTriggerFor]="profileMenu" class="user-btn">
              <div class="user-avatar">
                {{ userEmail() ? userEmail()!.charAt(0).toUpperCase() : 'C' }}
              </div>
              <span class="user-name">{{ userEmail() || 'Mon Compte' }}</span>
            </button>

            <mat-menu #profileMenu="matMenu">
              <div class="menu-header">
                <strong>Connecté en tant que Client</strong>
                <div class="menu-email">{{ userEmail() }}</div>
              </div>
              <mat-divider></mat-divider>
              @if (auth.isAdmin()) {
                <button mat-menu-item (click)="goToErp()">
                  <mat-icon color="primary">admin_panel_settings</mat-icon> Basculer vers ERP Admin
                </button>
              }
              <button mat-menu-item (click)="logout()">
                <mat-icon color="warn">logout</mat-icon> Se Déconnecter
              </button>
            </mat-menu>
          </div>
        </div>
      </header>

      <!-- Page Content Router Outlet -->
      <main class="portal-main">
        <div class="portal-container">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Portal Footer -->
      <footer class="portal-footer">
        <div class="portal-container footer-content">
          <div class="footer-brand">
            <strong>Kernova ERP — Portail Client Sécurisé</strong>
            <p>© 2026 Kernova. Tous droits réservés.</p>
          </div>
          <div class="footer-links">
            <a routerLink="/portal/dashboard">Accueil</a>
            <a routerLink="/portal/appointments">Rendez-vous</a>
            <a routerLink="/portal/quotes">Devis</a>
            <a routerLink="/portal/contracts">Contrats</a>
            <a routerLink="/portal/invoices">Factures</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .portal-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .portal-container {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .portal-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      background: #2563eb;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .brand-title {
      font-size: 16px;
      color: #0f172a;
    }

    .portal-nav {
      display: flex;
      gap: 6px;

      a {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 8px;
        color: #64748b;
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 500;
        transition: all 0.2s;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        &:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        &.active-nav {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 600;
        }
      }
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 4px 4px !important;
      border-radius: 20px !important;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }

    .notif-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .notif-empty {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #64748b;
    }
    .notif-list {
      max-height: 300px;
      overflow-y: auto;
    }
    .notif-item {
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      &:hover { background: #f8fafc; }
      &.unread { background: #eff6ff; }
    }
    .notif-ic { font-size: 20px; width: 20px; height: 20px; margin-top: 2px; }
    .notif-body { flex: 1; display: flex; flex-direction: column; }
    .notif-title { font-size: 13px; color: #0f172a; }
    .notif-msg { font-size: 12px; color: #64748b; margin: 2px 0 4px; }
    .notif-time { font-size: 10px; color: #94a3b8; }

    .menu-header {
      padding: 12px 16px;
      strong { font-size: 13px; color: #0f172a; }
    }

    .menu-email {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }

    .portal-main {
      flex: 1;
      padding: 32px 0;
    }

    .portal-footer {
      background: #0f172a;
      color: #94a3b8;
      padding: 28px 0;
      margin-top: auto;
      font-size: 13px;

      p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .footer-links {
      display: flex;
      gap: 16px;
      a { color: #94a3b8; text-decoration: none; &:hover { color: white; } }
    }
  `],
})
export class ClientPortalLayoutComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private clientPortalService = inject(ClientPortalService);
  private notificationService = inject(NotificationService);

  notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.loadClientNotifications();
  }

  loadClientNotifications(): void {
    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) return;
      this.notificationService
        .getByClient(clientId)
        .pipe(catchError(() => of([])))
        .subscribe(list => this.notifications.set(list || []));
    });
  }

  unreadCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  markAllAsRead(): void {
    const unread = this.notifications().filter(n => !n.read);
    if (unread.length === 0) return;

    const requests = unread.map(n => this.notificationService.markAsRead(n.idNotification));
    forkJoin(requests).subscribe(() => {
      this.notificationService.setUnreadCount(0);
      this.loadClientNotifications();
    });
  }

  markRead(n: Notification): void {
    if (n.read) return;
    this.notificationService.markAsRead(n.idNotification).subscribe(() => {
      this.loadClientNotifications();
    });
  }

  userEmail(): string | undefined {
    return this.auth.currentUser()?.email;
  }

  logout(): void {
    this.auth.logout();
  }

  goToErp(): void {
    this.router.navigate(['/dashboard']);
  }
}
