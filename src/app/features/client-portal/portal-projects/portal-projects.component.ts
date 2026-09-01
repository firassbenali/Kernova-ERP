import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { ClientPortalService } from '../../../core/services/client-portal.service';

import { Project } from '../../../domain/models/project.model';
import { ProjectDocument } from '../../../domain/models/project-document.model';

import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-portal-projects',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatExpansionModule,
    StatusChipComponent,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="portal-projects">
      <div class="welcome-banner mb-6">
        <div class="banner-text">
          <h1>Mes Projets & Livrables</h1>
          <p>Suivez l'avancement de vos projets, consultez les étapes franchies et téléchargez vos documents de projet.</p>
        </div>
      </div>

      <app-loading-overlay [loading]="loading()"></app-loading-overlay>

      @if (!loading()) {
        @if (projects().length === 0) {
          <app-empty-state
            icon="folder_open"
            title="Aucun projet associé"
            message="Vous n'avez actuellement aucun projet enregistré sur votre espace client."
          />
        } @else {
          <div class="projects-list flex flex-col gap-6">
            @for (p of projects(); track p.id) {
              <mat-card class="project-card">
                <div class="card-header flex justify-between items-center mb-4">
                  <div>
                    <h2 class="project-name">{{ p.name }}</h2>
                    <span class="phase-tag">Phase actuelle : {{ p.currentPhase || 'Planification' }}</span>
                  </div>
                  <div class="flex gap-2">
                    <app-status-chip [status]="p.status"></app-status-chip>
                  </div>
                </div>

                <p class="description">{{ p.description || 'Description non renseignée.' }}</p>

                <div class="progress-box mb-4">
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span>Avancement du Projet</span>
                    <span>{{ p.progress }}%</span>
                  </div>
                  <mat-progress-bar mode="determinate" [value]="p.progress"></mat-progress-bar>
                </div>

                <div class="meta-row grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span class="meta-label">Date de début</span>
                    <span class="meta-val">{{ p.startDate || '—' }}</span>
                  </div>
                  <div>
                    <span class="meta-label">Echéance / Date de fin</span>
                    <span class="meta-val">{{ p.endDate || '—' }}</span>
                  </div>
                </div>

                <!-- Expansion panel for project documents -->
                <mat-expansion-panel (opened)="loadProjectDocuments(p.id)" class="doc-panel">
                  <mat-expansion-panel-header>
                    <mat-panel-title class="flex items-center gap-2">
                      <mat-icon color="primary">description</mat-icon>
                      <strong>Documents & Deliverables du Projet</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>

                  @if (docLoading()[p.id]) {
                    <div class="p-4 text-center text-sm text-muted">Chargement des documents...</div>
                  } @else if (!projectDocs()[p.id] || projectDocs()[p.id].length === 0) {
                    <div class="p-4 text-center text-sm text-muted">Aucun document téléversé pour ce projet.</div>
                  } @else {
                    <div class="docs-grid">
                      @for (doc of projectDocs()[p.id]; track doc.id) {
                        <div class="doc-item flex justify-between items-center">
                          <div class="flex items-center gap-3">
                            <mat-icon style="color: #2563eb">insert_drive_file</mat-icon>
                            <div>
                              <strong class="text-sm block">{{ doc.title }}</strong>
                              <span class="text-xs text-muted">{{ doc.category }} | v{{ doc.version }}</span>
                            </div>
                          </div>
                          <button mat-flat-button color="primary" (click)="downloadDocument(doc)">
                            <mat-icon>download</mat-icon> Télécharger
                          </button>
                        </div>
                      }
                    </div>
                  }
                </mat-expansion-panel>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .welcome-banner {
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 28px 32px;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.2);
      h1 { margin: 0 0 6px; font-size: 24px; }
      p { margin: 0; opacity: 0.9; font-size: 14px; }
    }
    .project-card {
      padding: 24px !important;
      border-radius: 14px !important;
      border: 1px solid #e2e8f0;
    }
    .project-name { font-size: 20px; font-weight: 700; margin: 0 0 4px; color: #0f172a; }
    .phase-tag { font-size: 12px; color: #3b82f6; font-weight: 500; }
    .description { color: #64748b; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }

    .meta-label { display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; }
    .meta-val { font-size: 14px; font-weight: 600; color: #0f172a; }

    .doc-panel { border-radius: 10px !important; border: 1px solid #e2e8f0; margin-top: 12px; }
    .docs-grid { display: flex; flex-direction: column; gap: 10px; padding: 10px 0; }
    .doc-item {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
  `],
})
export class PortalProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private clientPortalService = inject(ClientPortalService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  projects = signal<Project[]>([]);

  docLoading = signal<Record<number, boolean>>({});
  projectDocs = signal<Record<number, ProjectDocument[]>>({});

  ngOnInit(): void {
    this.loadClientProjects();
  }

  loadClientProjects(): void {
    this.loading.set(true);

    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) {
        this.loading.set(false);
        return;
      }

      this.projectService
        .getAll()
        .pipe(catchError(() => of([])))
        .subscribe(allProjects => {
          // Client-side filtering by matching project.clientId
          const filtered = allProjects.filter(p => p.clientId === clientId);
          this.projects.set(filtered);
          this.loading.set(false);
        });
    });
  }

  loadProjectDocuments(projectId: number): void {
    if (this.projectDocs()[projectId]) return; // already loaded

    this.docLoading.update(map => ({ ...map, [projectId]: true }));

    this.projectService
      .getDocuments(projectId)
      .pipe(catchError(() => of([])))
      .subscribe(docs => {
        this.projectDocs.update(map => ({ ...map, [projectId]: docs }));
        this.docLoading.update(map => ({ ...map, [projectId]: false }));
      });
  }

  downloadDocument(doc: ProjectDocument): void {
    this.projectService.downloadDocument(doc.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.title || 'document';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Téléchargement échoué', 'Fermer', { duration: 4000 }),
    });
  }
}
