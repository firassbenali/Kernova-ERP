import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule, NgClass],
  template: `
    <span class="status-chip" [ngClass]="chipClass">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-chip {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }
    .chip-active, .chip-completed, .chip-done, .chip-available {
      background: rgba(22, 163, 74, 0.12);
      color: #16A34A;
    }
    .chip-approved {
      background: rgba(13, 148, 136, 0.12);
      color: #0D9488;
    }
    .chip-draft, .chip-inactive, .chip-cancelled, .chip-unavailable {
      background: rgba(100, 116, 139, 0.12);
      color: #64748B;
    }
    .chip-warning, .chip-on_hold, .chip-in_review, .chip-on-hold {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
    }
    .chip-error, .chip-overdue {
      background: rgba(220, 38, 38, 0.12);
      color: #DC2626;
    }
    .chip-primary, .chip-in_progress, .chip-planned, .chip-todo {
      background: rgba(27, 58, 107, 0.1);
      color: #1B3A6B;
    }
    .chip-admin {
      background: rgba(124, 58, 237, 0.12);
      color: #7C3AED;
    }
    .chip-employee {
      background: rgba(27, 58, 107, 0.1);
      color: #1B3A6B;
    }
    .chip-high, .chip-critical {
      background: rgba(220, 38, 38, 0.12);
      color: #DC2626;
    }
    .chip-medium {
      background: rgba(245, 158, 11, 0.12);
      color: #D97706;
    }
    .chip-low {
      background: rgba(22, 163, 74, 0.12);
      color: #16A34A;
    }
  `]
})
export class StatusChipComponent {
  @Input() status = '';
  @Input() type: 'status' | 'priority' | 'availability' = 'status';

  get chipClass(): string {
    return `chip-${this.status?.toLowerCase().replace(/_/g, '_')}`;
  }

  get label(): string {
    return (this.status ?? '').replace(/_/g, ' ');
  }
}
