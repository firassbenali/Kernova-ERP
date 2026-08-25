import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { ProjectDocument } from '../../../../domain/models/project-document.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  DocumentUploadDialogComponent,
} from '../document-upload-dialog/document-upload-dialog.component';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/projects"><mat-icon>arrow_back</mat-icon></a>
          <h1>Project Documents</h1>
        </div>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="upload()">
            <mat-icon>upload_file</mat-icon> Upload
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="description" title="No documents" message="Upload a document to get started." />
        } @else {
          <table mat-table [dataSource]="dataSource" class="w-full">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let row">{{ row.title }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let row">{{ row.category }}</td>
            </ng-container>
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Version</th>
              <td mat-cell *matCellDef="let row">{{ row.version }}</td>
            </ng-container>
            <ng-container matColumnDef="uploadedAt">
              <th mat-header-cell *matHeaderCellDef>Uploaded</th>
              <td mat-cell *matCellDef="let row">{{ row.uploadedAt }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item (click)="download(row)">
                    <mat-icon>download</mat-icon> Download
                  </button>
                  <button mat-menu-item (click)="delete(row)">
                    <mat-icon color="warn">delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [``],
})
export class DocumentListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(ProjectService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<ProjectDocument>([]);
  columns = ['title', 'category', 'version', 'uploadedAt', 'actions'];

  private projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getDocuments(this.projectId)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.loading.set(false);
      });
  }

  upload(): void {
    this.dialog
      .open(DocumentUploadDialogComponent, {
        width: '480px',
        data: { projectId: this.projectId },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(formData => this.service.uploadDocument(this.projectId, formData))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Document uploaded', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Upload failed', 'Dismiss', { duration: 4000 }),
      });
  }

  download(doc: ProjectDocument): void {
    this.service.downloadDocument(doc.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.title || 'document';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Dismiss', { duration: 4000 }),
    });
  }

  delete(doc: ProjectDocument): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Document',
          message: `Delete "${doc.title}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.deleteDocument(doc.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Document deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
