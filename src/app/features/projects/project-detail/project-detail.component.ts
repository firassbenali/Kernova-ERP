import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../domain/models/project.model';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import {
  ProjectFormDialogComponent,
  ProjectDialogData,
} from '../project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule,
    StatusChipComponent,
    LoadingOverlayComponent,
    DecimalPipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/projects"><mat-icon>arrow_back</mat-icon></a>
          <h1>{{ project()?.name ?? 'Project' }}</h1>
        </div>
        <div class="page-header-actions">
          <button mat-stroked-button (click)="edit()">
            <mat-icon>edit</mat-icon> Edit
          </button>
        </div>
      </div>

      <app-loading-overlay [loading]="loading()"></app-loading-overlay>

      @if (project(); as p) {
        <mat-card class="detail-card">
          <div class="progress-header">
            <div>
              <app-status-chip [status]="p.status"></app-status-chip>
              <app-status-chip [status]="p.priority" type="priority"></app-status-chip>
            </div>
            <span class="phase">{{ p.currentPhase }}</span>
          </div>
          <div class="progress-section">
            <div class="progress-label">
              <span>Progress</span>
              <strong>{{ p.progress }}%</strong>
            </div>
            <mat-progress-bar mode="determinate" [value]="p.progress"></mat-progress-bar>
          </div>
          <p class="description">{{ p.description || 'No description.' }}</p>
          <div class="detail-grid">
            <div><span class="label">Budget</span><span>{{ p.budget | number }}</span></div>
            <div><span class="label">Start</span><span>{{ p.startDate }}</span></div>
            <div><span class="label">Deadline</span><span>{{ p.endDate }}</span></div>
            <div><span class="label">Client ID</span><span>{{ p.clientId ?? '—' }}</span></div>
          </div>
        </mat-card>

        <nav class="tab-nav">
          <a mat-stroked-button [routerLink]="['/projects', p.id, 'tasks']">
            <mat-icon>task_alt</mat-icon> Tasks
          </a>
          <a mat-stroked-button [routerLink]="['/projects', p.id, 'documents']">
            <mat-icon>description</mat-icon> Documents
          </a>
        </nav>
      }
    </div>
  `,
  styles: [`
    .detail-card { padding: 24px !important; margin-bottom: 24px; }
    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .phase { font-size: 13px; color: var(--color-text-secondary); }
    .progress-section { margin-bottom: 20px; }
    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .description {
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      .label {
        display: block;
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: uppercase;
        margin-bottom: 4px;
      }
    }
    .tab-nav { display: flex; gap: 12px; flex-wrap: wrap; }
  `],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(ProjectService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  project = signal<Project | null>(null);
  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getById(this.projectId)
      .pipe(catchError(() => of(null)))
      .subscribe(p => {
        this.project.set(p);
        this.loading.set(false);
      });
  }

  edit(): void {
    const p = this.project();
    if (!p) return;
    this.dialog
      .open(ProjectFormDialogComponent, {
        width: '520px',
        data: { project: p } satisfies ProjectDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.service.update(p.id, form))
      )
      .subscribe({
        next: updated => {
          this.project.set(updated);
          this.snackBar.open('Project updated', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Update failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
