import { Component, ViewChild, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, SidebarComponent, TopbarComponent],
  template: `
    <mat-sidenav-container class="layout-container">
      <!-- Sidebar -->
      <mat-sidenav
        #sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpened()"
        [fixedInViewport]="!isDesktop()"
        [style.width]="sidenavWidth"
        class="layout-sidenav">
        <app-sidebar [collapsed]="false"></app-sidebar>
      </mat-sidenav>

      <!-- Main content -->
      <mat-sidenav-content class="layout-content">
        <app-topbar (menuToggle)="sidenav.toggle()"></app-topbar>
        <main class="layout-main">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .layout-container {
      height: 100vh;
      background: var(--color-bg);
    }

    .layout-sidenav {
      background: var(--color-surface);
      border-right: 1px solid var(--color-border-light);
      box-shadow: var(--shadow-md);
    }

    .layout-content {
      display: flex;
      flex-direction: column;
      background: var(--color-bg);
      min-height: 100vh;
    }

    .layout-main {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private bp = inject(BreakpointObserver);

  readonly isDesktop = toSignal(
    this.bp.observe([Breakpoints.Large, Breakpoints.XLarge]).pipe(map(s => s.matches)),
    { initialValue: true }
  );

  readonly sidenavMode = computed<'side' | 'over'>(() => this.isDesktop() ? 'side' : 'over');
  readonly sidenavOpened = computed(() => this.isDesktop());
  readonly sidenavWidth = 'var(--sidebar-width)';
}
