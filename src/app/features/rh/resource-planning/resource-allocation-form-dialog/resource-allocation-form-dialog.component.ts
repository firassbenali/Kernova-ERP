import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Employee } from '../../../../domain/models/employee.model';
import { Project } from '../../../../domain/models/project.model';
import { Team } from '../../../../domain/models/team.model';
import { ResourceAllocation } from '../../../../domain/models/resource-planning.model';

export interface ResourceAllocationDialogData {
  allocation?: ResourceAllocation;
  employees: Employee[];
  projects: Project[];
  teams?: Team[];
  selectedProjectId?: number;
}

export interface ResourceAllocationFormResult {
  targetType: 'EMPLOYEE' | 'TEAM';
  teamId?: number;
  request: {
    employeeId?: number;
    projectId: number;
    allocationPercentage: number;
    startDate: string;
    endDate: string;
    role?: string | null;
    status?: string;
  };
  isEdit: boolean;
}

@Component({
  selector: 'app-resource-allocation-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.allocation ? 'Edit Allocation' : 'Allocate Resource to Project' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        @if (!data.allocation && data.teams && data.teams.length > 0) {
          <div class="full-width mode-toggle-wrap mb-2">
            <mat-label class="toggle-label">Assign To:</mat-label>
            <mat-button-toggle-group formControlName="targetType" (change)="onTargetTypeChange($event.value)">
              <mat-button-toggle value="EMPLOYEE">Individual Employee</mat-button-toggle>
              <mat-button-toggle value="TEAM">Entire Team</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        }

        @if (form.controls.targetType.value === 'EMPLOYEE') {
          <mat-form-field appearance="outline">
            <mat-label>Employee</mat-label>
            <mat-select formControlName="employeeId" [disabled]="!!data.allocation">
              @for (employee of data.employees; track employee.id) {
                <mat-option [value]="employee.id">{{ employee.username }} ({{ employee.departmentName || 'Staff' }})</mat-option>
              }
            </mat-select>
            @if (form.controls.employeeId.hasError('required')) {
              <mat-error>Employee is required</mat-error>
            }
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>Team</mat-label>
            <mat-select formControlName="teamId">
              @for (team of data.teams || []; track team.id) {
                <mat-option [value]="team.id">{{ team.name }} (Leader: {{ team.leaderName || '—' }})</mat-option>
              }
            </mat-select>
            @if (form.controls.teamId.hasError('required')) {
              <mat-error>Team is required</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Project</mat-label>
          <mat-select formControlName="projectId" [disabled]="!!data.allocation || !!data.selectedProjectId">
            @for (project of data.projects; track project.id) {
              <mat-option [value]="project.id">{{ project.name }}</mat-option>
            }
          </mat-select>
          @if (form.controls.projectId.hasError('required')) {
            <mat-error>Project is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Allocation %</mat-label>
          <input matInput type="number" min="0" max="100" formControlName="allocationPercentage" />
          <mat-hint>Total active allocation across all projects cannot exceed 100% for overlapping dates</mat-hint>
          @if (form.controls.allocationPercentage.hasError('required')) {
            <mat-error>Allocation percentage is required</mat-error>
          }
          @if (form.controls.allocationPercentage.hasError('min') || form.controls.allocationPercentage.hasError('max')) {
            <mat-error>Allocation must be between 0 and 100</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Start Date</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
          @if (form.controls.startDate.hasError('required')) {
            <mat-error>Start date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>End Date</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          @if (form.controls.endDate.hasError('required')) {
            <mat-error>End date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role (optional)</mat-label>
          <input matInput formControlName="role" placeholder="e.g., Developer, Consultant, Designer" maxlength="100" />
        </mat-form-field>

        @if (data.allocation) {
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Active</mat-option>
              <mat-option value="INACTIVE">Inactive</mat-option>
              <mat-option value="COMPLETED">Completed</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.allocation ? 'Update' : 'Allocate' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 16px;
        min-width: 520px;
      }
      .full-width { grid-column: 1 / -1; }
      .mode-toggle-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .toggle-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-secondary);
      }
      mat-form-field { width: 100%; }
    `,
  ],
})
export class ResourceAllocationFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<ResourceAllocationFormDialogComponent, ResourceAllocationFormResult>);
  data = inject<ResourceAllocationDialogData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    targetType: this.fb.nonNullable.control<'EMPLOYEE' | 'TEAM'>('EMPLOYEE'),
    employeeId: this.fb.nonNullable.control<number | null>(this.data.allocation?.employeeId ?? null),
    teamId: this.fb.nonNullable.control<number | null>(null),
    projectId: this.fb.nonNullable.control<number | null>(
      this.data.allocation?.projectId ?? this.data.selectedProjectId ?? null,
      Validators.required
    ),
    allocationPercentage: this.fb.nonNullable.control<number>(
      this.data.allocation?.allocationPercentage ?? 100,
      [Validators.required, Validators.min(0), Validators.max(100)]
    ),
    startDate: this.fb.nonNullable.control<Date>(
      this.data.allocation?.startDate ? new Date(this.data.allocation.startDate) : new Date(),
      Validators.required
    ),
    endDate: this.fb.nonNullable.control<Date>(
      this.data.allocation?.endDate
        ? new Date(this.data.allocation.endDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      Validators.required
    ),
    role: this.fb.nonNullable.control(this.data.allocation?.role ?? ''),
    status: this.fb.nonNullable.control(this.data.allocation?.status ?? 'ACTIVE'),
  });

  ngOnInit(): void {
    this.updateTargetValidators('EMPLOYEE');

    this.form.controls.endDate.setValidators([
      Validators.required,
      (control) => {
        const start = this.form.controls.startDate.value;
        const end = control.value;
        if (start && end && end < start) {
          return { dateOrder: true };
        }
        return null;
      },
    ]);
    this.form.controls.endDate.updateValueAndValidity();
  }

  onTargetTypeChange(type: 'EMPLOYEE' | 'TEAM'): void {
    this.updateTargetValidators(type);
  }

  private updateTargetValidators(type: 'EMPLOYEE' | 'TEAM'): void {
    if (type === 'EMPLOYEE') {
      this.form.controls.employeeId.setValidators([Validators.required]);
      this.form.controls.teamId.clearValidators();
      this.form.controls.teamId.setValue(null);
    } else {
      this.form.controls.teamId.setValidators([Validators.required]);
      this.form.controls.employeeId.clearValidators();
      this.form.controls.employeeId.setValue(null);
    }
    this.form.controls.employeeId.updateValueAndValidity();
    this.form.controls.teamId.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const result: ResourceAllocationFormResult = {
      targetType: raw.targetType,
      teamId: raw.teamId ?? undefined,
      request: {
        employeeId: raw.employeeId ?? undefined,
        projectId: raw.projectId!,
        allocationPercentage: raw.allocationPercentage,
        startDate: this.toDateOnly(raw.startDate),
        endDate: this.toDateOnly(raw.endDate),
        role: raw.role || undefined,
        status: this.data.allocation ? raw.status : undefined,
      },
      isEdit: !!this.data.allocation,
    };

    this.dialogRef.close(result);
  }

  private toDateOnly(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}