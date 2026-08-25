import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings-placeholder',
  standalone: true,
  imports: [MatIconModule, MatCardModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Settings</h1>
      </div>
      <mat-card class="placeholder-card">
        <mat-icon>construction</mat-icon>
        <h2>Coming soon</h2>
        <p>Account preferences and application settings will be available in a future release.</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 64px 32px !important;

      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--color-text-muted);
        margin-bottom: 16px;
      }

      h2 { font-size: 18px; margin-bottom: 8px; }
      p { color: var(--color-text-secondary); max-width: 400px; }
    }
  `],
})
export class SettingsPlaceholderComponent {}
