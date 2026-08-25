import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Department } from '../../../../domain/models/department.model';

export interface DepartmentDialogData {
  department?: Department;
}

@Component({
  selector: 'app-department-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.department ? 'Edit Department' : 'New Department' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.department ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DepartmentFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<DepartmentFormDialogComponent>);
  data = inject<DepartmentDialogData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    name: [this.data.department?.name ?? '', Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
