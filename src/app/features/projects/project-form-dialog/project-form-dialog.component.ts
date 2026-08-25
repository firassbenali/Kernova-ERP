import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Project, ProjectPriority, ProjectStatus } from '../../../domain/models/project.model';

export interface ProjectDialogData {
  project?: Project;
}

const STATUSES: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const PRIORITIES: ProjectPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.project ? 'Edit Project' : 'New Project' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Client ID</mat-label>
          <input matInput type="number" formControlName="clientId" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Contract ID</mat-label>
          <input matInput type="number" formControlName="contractId" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Budget</mat-label>
          <input matInput type="number" formControlName="budget" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            @for (p of priorities; track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s.replace('_', ' ') }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Current Phase</mat-label>
          <input matInput formControlName="currentPhase" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Progress (%)</mat-label>
          <input matInput type="number" formControlName="progress" min="0" max="100" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Start Date</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
          <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>End Date</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.project ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 400px;
      max-height: 70vh;
      overflow-y: auto;
    }
  `],
})
export class ProjectFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);
  data = inject<ProjectDialogData>(MAT_DIALOG_DATA);

  statuses = STATUSES;
  priorities = PRIORITIES;

  form = this.fb.nonNullable.group({
    name: [this.data.project?.name ?? '', Validators.required],
    description: [this.data.project?.description ?? ''],
    clientId: [this.data.project?.clientId ?? null],
    contractId: [this.data.project?.contractId ?? null],
    budget: [this.data.project?.budget ?? 0, Validators.required],
    priority: [this.data.project?.priority ?? 'MEDIUM' as ProjectPriority, Validators.required],
    status: [this.data.project?.status ?? 'PLANNED' as ProjectStatus, Validators.required],
    currentPhase: [this.data.project?.currentPhase ?? 'Planning'],
    progress: [this.data.project?.progress ?? 0],
    startDate: [
      this.data.project?.startDate ? new Date(this.data.project.startDate) : new Date(),
    ],
    endDate: [
      this.data.project?.endDate
        ? new Date(this.data.project.endDate)
        : new Date(Date.now() + 90 * 86400000),
    ],
  });

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      ...raw,
      startDate: this.toDateString(raw.startDate),
      endDate: this.toDateString(raw.endDate),
    });
  }

  private toDateString(value: Date | string): string {
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  }
}
