import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Project, ProjectPriority, ProjectStatus, ProjectPhase } from '../../../domain/models/project.model';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../domain/models/client.model';

export interface ProjectDialogData {
  project?: Project;
}

const STATUSES: ProjectStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'];
const PRIORITIES: ProjectPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
const PHASES: ProjectPhase[] = ['INITIATION', 'PLANNING', 'EXECUTION', 'MONITORING', 'CLOSING'];

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
          <mat-label>Name *</mat-label>
          <input matInput formControlName="name" placeholder="Project name (min 3 chars)" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          } @else if (form.get('name')?.hasError('minlength')) {
            <mat-error>Name must be at least 3 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Project description..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Client Association</mat-label>
          <mat-select formControlName="clientId">
            <mat-option [value]="null">-- None (Internal Project) --</mat-option>
            @for (c of clients; track c.idClient) {
              <mat-option [value]="c.idClient">{{ c.companyName }} (#{{ c.idClient }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contract ID (Optional)</mat-label>
          <input matInput type="number" formControlName="contractId" placeholder="e.g. 101" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Budget (TND) *</mat-label>
          <input matInput type="number" formControlName="budget" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Priority *</mat-label>
          <mat-select formControlName="priority">
            @for (p of priorities; track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status *</mat-label>
          <mat-select formControlName="status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s.replace('_', ' ') }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Current Phase *</mat-label>
          <mat-select formControlName="currentPhase">
            @for (ph of phases; track ph) {
              <mat-option [value]="ph">{{ ph }}</mat-option>
            }
          </mat-select>
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
          <mat-label>End Date / Deadline</mat-label>
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
      min-width: 420px;
      max-height: 70vh;
      overflow-y: auto;
    }
  `],
})
export class ProjectFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);
  data = inject<ProjectDialogData>(MAT_DIALOG_DATA);

  statuses = STATUSES;
  priorities = PRIORITIES;
  phases = PHASES;
  clients: Client[] = [];

  form = this.fb.group({
    name: [this.data.project?.name ?? '', [Validators.required, Validators.minLength(3)]],
    description: [this.data.project?.description ?? ''],
    clientId: [this.data.project?.clientId ?? null],
    contractId: [this.data.project?.contractId ?? null],
    budget: [this.data.project?.budget ?? 0, [Validators.required, Validators.min(0)]],
    priority: [this.data.project?.priority ?? ('MEDIUM' as ProjectPriority), [Validators.required]],
    status: [this.data.project?.status ?? ('PLANNED' as ProjectStatus), [Validators.required]],
    currentPhase: [this.data.project?.currentPhase ?? ('PLANNING' as ProjectPhase), [Validators.required]],
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

  ngOnInit(): void {
    this.clientService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(list => (this.clients = list));
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();

    const payload: Partial<Project> = {
      name: raw.name!,
      description: raw.description || '',
      budget: raw.budget ?? 0,
      priority: raw.priority as ProjectPriority,
      status: raw.status as ProjectStatus,
      currentPhase: raw.currentPhase || 'Planning',
      progress: raw.progress ?? 0,
      startDate: this.toDateString(raw.startDate),
      endDate: this.toDateString(raw.endDate),
    };

    if (raw.clientId) payload.clientId = Number(raw.clientId);
    if (raw.contractId) payload.contractId = Number(raw.contractId);

    this.dialogRef.close(payload);
  }

  private toDateString(value: Date | string | null | undefined): string {
    if (!value) return new Date().toISOString().split('T')[0];
    if (value instanceof Date) {
      if (isNaN(value.getTime())) return new Date().toISOString().split('T')[0];
      return value.toISOString().split('T')[0];
    }
    return String(value);
  }
}
