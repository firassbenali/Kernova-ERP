import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';

import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/auth/auth.service';
import { DocumentModel } from '../../../domain/models/document.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-portal-documents',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DatePipe,
  ],
  template: `
    <div class="portal-section">
      <div class="section-header">
        <div>
          <h2>Coffre-fort Documentaire</h2>
          <p class="subtitle">Espace sécurisé de partage de documents et téléversement de fichiers</p>
        </div>
        <label mat-flat-button color="primary" class="upload-btn">
          <mat-icon>cloud_upload</mat-icon> Téléverser un Document
          <input type="file" (change)="onFileSelected($event)" hidden />
        </label>
      </div>

      <div class="portal-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && documents().length === 0) {
          <app-empty-state
            icon="cloud_upload"
            title="Aucun document partage"
            message="Partagez ou téléchargez les documents importants liés à vos projets."
          />
        } @else {
          <div class="docs-grid">
            @for (doc of documents(); track doc.idDocument) {
              <div class="doc-card">
                <div class="doc-icon">
                  <mat-icon>description</mat-icon>
                </div>
                <div class="doc-info">
                  <div class="doc-title">{{ doc.title || doc.fileName }}</div>
                  <div class="doc-sub">{{ doc.fileName }} ({{ doc.category || 'Général' }})</div>
                  <div class="doc-date">Déposé le {{ doc.uploadedAt | date:'mediumDate' }}</div>
                </div>
                <div class="doc-actions">
                  <button mat-icon-button color="primary" (click)="download(doc)" matTooltip="Télécharger">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; h2 { margin: 0; font-size: 22px; color: #0f172a; } }
    .subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }
    .portal-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

    .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .doc-card { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
    .doc-icon { width: 44px; height: 44px; border-radius: 10px; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; }
    .doc-info { flex: 1; overflow: hidden; }
    .doc-title { font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-sub { font-size: 11px; color: #64748b; }
    .doc-date { font-size: 10px; color: #94a3b8; }
    .upload-btn { cursor: pointer; }
  `],
})
export class PortalDocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  documents = signal<DocumentModel[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const clientId = this.authService.currentUser()?.id;
    if (!clientId) {
      this.documents.set([]);
      this.loading.set(false);
      return;
    }

    this.documentService.getDocuments(clientId).subscribe({
      next: res => {
        const filtered = (res || []).filter(d => !d.clientId || d.clientId === clientId);
        this.documents.set(filtered);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const clientId = this.authService.currentUser()?.id;
      this.documentService
        .uploadDocument(file, clientId, undefined, file.name, 'Client Portal', 'Document déposé depuis le Portail Client')
        .subscribe({
          next: () => {
            this.snackBar.open('Document téléversé avec succès !', 'OK', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Erreur lors du téléversement', 'Fermer', { duration: 4000 }),
        });
    }
  }

  download(doc: DocumentModel): void {
    if (!doc.idDocument) return;
    this.documentService.downloadDocument(doc.idDocument).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || doc.title || 'document.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
