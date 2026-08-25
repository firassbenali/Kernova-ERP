import { Component, Input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    @if (loading) {
      <div class="loading-overlay">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 10;
    }
  `]
})
export class LoadingOverlayComponent {
  @Input() loading = false;
}
