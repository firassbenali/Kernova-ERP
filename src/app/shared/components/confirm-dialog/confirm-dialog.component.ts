import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="confirm-dialog__header" [class.confirm-dialog__header--danger]="data.danger">
        <mat-icon>{{ data.danger ? 'warning' : 'help_outline' }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [mat-dialog-close]="false">{{ data.cancelLabel || 'Cancel' }}</button>
        <button mat-flat-button
          [color]="data.danger ? 'warn' : 'primary'"
          [mat-dialog-close]="true">
          {{ data.confirmLabel || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { min-width: 380px; }
    .confirm-dialog__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 24px 0;
      mat-icon { color: var(--color-primary); font-size: 28px; width: 28px; height: 28px; }
      h2 { margin: 0; font-size: 18px; font-weight: 600; color: var(--color-text-primary); }
    }
    .confirm-dialog__header--danger mat-icon { color: var(--color-warn); }
    mat-dialog-content p { color: var(--color-text-secondary); line-height: 1.6; margin-top: 8px; }
    mat-dialog-actions { padding: 16px 24px 24px; gap: 8px; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
