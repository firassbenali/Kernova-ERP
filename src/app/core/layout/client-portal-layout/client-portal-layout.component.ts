import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/auth.service';

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
            <a routerLink="/portal/documents" routerLinkActive="active-nav">
              <mat-icon>folder_zip</mat-icon> Mes Documents
            </a>
          </nav>

          <!-- User Menu -->
          <div class="user-menu">
            <button mat-button [matMenuTriggerFor]="profileMenu" class="user-btn">
              <div class="user-avatar">
                {{ userEmail() ? userEmail()!.charAt(0).toUpperCase() : 'C' }}
              </div>
              <span class="user-name">{{ userEmail() || 'Mon Compte' }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
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

      <!-- Main Portal Content -->
      <main class="portal-main">
        <div class="portal-container">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Portal Footer -->
      <footer class="portal-footer">
        <div class="portal-container footer-content">
          <span>&copy; 2026 Kernova ERP Platform - Portail Client Sécurisé.</span>
          <div class="footer-links">
            <a href="#">Support Technique</a>
            <a href="#">Conditions Générales</a>
            <a href="#">Politique de Confidentialité</a>
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
      background-color: #f8fafc;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .portal-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      width: 100%;
    }

    .portal-header {
      background: #0f172a;
      color: white;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .header-content {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
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
      font-weight: 800;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }

    .brand-title {
      font-size: 18px;
      color: #94a3b8;
      strong { color: white; }
    }

    .portal-nav {
      display: flex;
      align-items: center;
      gap: 8px;

      a {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #94a3b8;
        text-decoration: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13.5px;
        font-weight: 500;
        transition: all 0.2s ease;

        mat-icon { font-size: 18px; width: 18px; height: 18px; }

        &:hover {
          color: white;
          background: rgba(255, 255, 255, 0.08);
        }

        &.active-nav {
          color: white;
          background: #2563eb;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
        }
      }
    }

    .user-btn {
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-name {
      font-size: 13px;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-header {
      padding: 12px 16px;
      font-size: 13px;
      .menu-email { color: #64748b; font-size: 12px; margin-top: 2px; }
    }

    .portal-main {
      flex: 1;
      padding: 32px 0;
    }

    .portal-footer {
      background: #0f172a;
      color: #64748b;
      padding: 20px 0;
      font-size: 13px;
      border-top: 1px solid #1e293b;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .footer-links {
      display: flex;
      gap: 16px;
      a { color: #94a3b8; text-decoration: none; &:hover { color: white; } }
    }
  `],
})
export class ClientPortalLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

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
