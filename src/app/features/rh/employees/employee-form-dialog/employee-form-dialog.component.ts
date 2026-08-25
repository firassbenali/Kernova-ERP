import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Employee } from '../../../../domain/models/employee.model';
import { DepartmentService } from '../../../../core/services/department.service';
import { PositionService } from '../../../../core/services/position.service';
import { Department } from '../../../../domain/models/department.model';
import { Position } from '../../../../domain/models/position.model';

export interface EmployeeDialogData {
  employee?: Employee;
}

const AVAILABILITY_OPTIONS = ['AVAILABLE', 'UNAVAILABLE', 'ON_LEAVE', 'BUSY'];

@Component({
  selector: 'app-employee-form-dialog',
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
    <h2 mat-dialog-title>{{ data.employee ? 'Edit Employee' : 'New Employee' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        @if (!data.employee) {
          <mat-form-field appearance="outline">
            <mat-label>User ID</mat-label>
            <input matInput type="number" formControlName="userId" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select formControlName="departmentId">
            @for (d of departments; track d.id) {
              <mat-option [value]="d.id">{{ d.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Position</mat-label>
          <mat-select formControlName="positionId">
            @for (p of positions; track p.id) {
              <mat-option [value]="p.id">{{ p.title }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Hire Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="hireDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Availability</mat-label>
          <mat-select formControlName="availability">
            @for (a of availabilityOptions; track a) {
              <mat-option [value]="a">{{ a.replace('_', ' ') }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.employee ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 360px;
    }
  `],
})
export class EmployeeFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private departmentService = inject(DepartmentService);
  private positionService = inject(PositionService);
  dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent>);
  data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  departments: Department[] = [];
  positions: Position[] = [];
  availabilityOptions = AVAILABILITY_OPTIONS;

  form = this.fb.nonNullable.group({
    userId: [this.data.employee?.userId ?? 0, Validators.required],
    departmentId: [this.data.employee?.departmentId ?? 0, Validators.required],
    positionId: [this.data.employee?.positionId ?? 0, Validators.required],
    phone: [this.data.employee?.phone ?? ''],
    hireDate: [this.data.employee?.hireDate ? new Date(this.data.employee.hireDate) : new Date()],
    availability: [this.data.employee?.availability ?? 'AVAILABLE', Validators.required],
  });

  constructor() {
    if (this.data.employee) {
      this.form.controls.userId.disable();
    }
  }

  ngOnInit(): void {
    forkJoin({
      departments: this.departmentService.getAll().pipe(catchError(() => of([]))),
      positions: this.positionService.getAll().pipe(catchError(() => of([]))),
    }).subscribe(({ departments, positions }) => {
      this.departments = departments;
      this.positions = positions;
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const hireDate =
      raw.hireDate instanceof Date
        ? raw.hireDate.toISOString().split('T')[0]
        : String(raw.hireDate);
    this.dialogRef.close({ ...raw, hireDate });
  }
}
