import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule, MatDividerModule],
  template: `
    <div class="sidebar">
      <!-- Brand -->
      <div class="sidebar__brand">
        <div class="brand-logo">
          <span class="brand-logo__icon">K</span>
        </div>
        <div class="brand-text" [class.hidden]="collapsed">
          <span class="brand-text__name">Krenova</span>
          <span class="brand-text__sub">ERP Platform</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Navigation -->
      <nav class="sidebar__nav">
        @for (item of visibleNavItems; track item.label) {
          @if (!item.children) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="nav-item--active"
               [title]="collapsed ? item.label : ''">
              <mat-icon class="nav-item__icon">{{ item.icon }}</mat-icon>
              <span class="nav-item__label" [class.hidden]="collapsed">{{ item.label }}</span>
            </a>
          } @else {
            <div class="nav-group">
              <div class="nav-group__header" [class.hidden]="collapsed">
                {{ item.label }}
              </div>
              @if (collapsed) {
                <mat-divider style="margin: 4px 0"></mat-divider>
              }
              @for (child of item.children; track child.label) {
                <a class="nav-item nav-item--child"
                   [routerLink]="child.route"
                   routerLinkActive="nav-item--active"
                   [title]="collapsed ? child.label : ''">
                  <mat-icon class="nav-item__icon">{{ child.icon }}</mat-icon>
                  <span class="nav-item__label" [class.hidden]="collapsed">{{ child.label }}</span>
                </a>
              }
            </div>
          }
        }
      </nav>

      <!-- Bottom -->
      <div class="sidebar__bottom">
        <mat-divider></mat-divider>
        <a class="nav-item" routerLink="/settings" routerLinkActive="nav-item--active">
          <mat-icon class="nav-item__icon">settings</mat-icon>
          <span class="nav-item__label" [class.hidden]="collapsed">Settings</span>
        </a>
        <button class="nav-item" (click)="logout()" style="width: 100%; justify-content: flex-start; text-align: left; border: none; background: none; font: inherit; color: inherit; cursor: pointer;">
          <mat-icon class="nav-item__icon">logout</mat-icon>
          <span class="nav-item__label" [class.hidden]="collapsed">Logout</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-surface);
      overflow: hidden;
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      min-height: var(--topbar-height);
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      background: var(--color-primary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-logo__icon {
      color: white;
      font-size: 20px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .brand-text__name {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.2;
      white-space: nowrap;
    }

    .brand-text__sub {
      font-size: 11px;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .sidebar__nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 12px 8px;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }

    .nav-group {
      margin-bottom: 4px;
    }

    .nav-group__header {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--color-text-muted);
      padding: 12px 12px 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--color-text-secondary);
      transition: background var(--transition-fast), color var(--transition-fast);
      cursor: pointer;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;

      &:hover {
        background: var(--color-surface-alt);
        color: var(--color-text-primary);
      }

      &.nav-item--active {
        background: rgba(27, 58, 107, 0.08);
        color: var(--color-primary);

        .nav-item__icon { color: var(--color-primary); }
      }
    }

    .nav-item--child {
      padding-left: 14px;
    }

    .nav-item__icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: inherit;
    }

    .nav-item__label {
      font-size: 13.5px;
      font-weight: 500;
      overflow: hidden;
      transition: opacity var(--transition-base), width var(--transition-base);
    }

    .hidden {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }

    .sidebar__bottom {
      padding: 8px;
    }
  `],
})
export class SidebarComponent {
  @Input() collapsed = false;

  private auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    {
      label: 'CRM & Clients', icon: 'business',
      children: [
        { label: 'Clients',      icon: 'store',       route: '/clients' },
        { label: 'Rendez-vous',  icon: 'event',       route: '/clients/appointments' },
      ]
    },
    {
      label: 'Human Resources', icon: 'people',
      children: [
        { label: 'Employees',   icon: 'badge',         route: '/rh/employees' },
        { label: 'Departments', icon: 'account_tree',  route: '/rh/departments' },
        { label: 'Positions',   icon: 'work',          route: '/rh/positions' },
        { label: 'Skills',      icon: 'psychology',    route: '/rh/skills' },
        { label: 'Teams',       icon: 'group',         route: '/rh/teams' },
        { label: 'Performance', icon: 'insights',      route: '/rh/performance' },
        { label: 'Resource Planning', icon: 'engineering', route: '/rh/resource-planning' },
      ]
    },
    {
      label: 'Projects', icon: 'folder',
      children: [
        { label: 'Projects',   icon: 'folder_open',  route: '/projects' },
        { label: 'Tasks',      icon: 'task_alt',     route: '/tasks' },
        { label: 'Documents',  icon: 'description',  route: '/documents' },
      ]
    },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    {
      label: 'Administration', icon: 'admin_panel_settings',
      adminOnly: true,
      children: [
        { label: 'Users', icon: 'manage_accounts', route: '/users' },
      ]
    },
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(item => !item.adminOnly || this.auth.isAdmin());
  }
}