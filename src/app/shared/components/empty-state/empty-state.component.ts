import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-state__icon">{{ icon }}</mat-icon>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 32px;
      text-align: center;
    }
    .empty-state__icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--color-border);
      margin-bottom: 16px;
    }
    .empty-state__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 8px;
    }
    .empty-state__message {
      font-size: 14px;
      color: var(--color-text-secondary);
      margin: 0 0 24px;
      max-width: 320px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No data found';
  @Input() message = 'There is nothing to display here yet.';
}
