import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DocumentUploadData {
  projectId: number;
}

export interface DocumentUploadResult {
  formData: FormData;
}

@Component({
  selector: 'app-document-upload-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Upload Document</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <input matInput formControlName="category" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Version</mat-label>
          <input matInput formControlName="version" />
        </mat-form-field>
        <div class="file-field">
          <input #fileInput type="file" (change)="onFileSelected($event)" />
          <span class="file-name" [class.file-name--selected]="selectedFile">
            {{ selectedFile ? selectedFile.name : 'No file selected' }}
          </span>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || !selectedFile" (click)="save()">
        Upload
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 400px;
    }
    .file-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0 4px;
    }
    .file-name {
      font-size: 13px;
      color: var(--color-text-secondary);
      &--selected { color: var(--color-text-primary); font-weight: 500; }
    }
  `],
})
export class DocumentUploadDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DocumentUploadDialogComponent>);

  selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    category: [''],
    version: ['1.0'],
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  save(): void {
    if (this.form.invalid || !this.selectedFile) return;
    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', raw.title);
    formData.append('category', raw.category || 'General');
    formData.append('version', raw.version);
    this.dialogRef.close(formData);
  }
}
