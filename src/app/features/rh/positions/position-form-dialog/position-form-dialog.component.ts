import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Position } from '../../../../domain/models/position.model';

export interface PositionDialogData {
  position?: Position;
}

@Component({
  selector: 'app-position-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.position ? 'Edit Position' : 'New Position' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.position ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class PositionFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<PositionFormDialogComponent>);
  data = inject<PositionDialogData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    title: [this.data.position?.title ?? '', Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
