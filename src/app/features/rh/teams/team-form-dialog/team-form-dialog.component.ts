import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Team } from '../../../../domain/models/team.model';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Employee } from '../../../../domain/models/employee.model';

export interface TeamDialogData {
  team?: Team;
}

@Component({
  selector: 'app-team-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.team ? 'Edit Team' : 'New Team' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Team Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Team Leader</mat-label>
          <mat-select formControlName="leaderId">
            @for (e of employees; track e.id) {
              <mat-option [value]="e.id">{{ e.username }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.team ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class TeamFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  dialogRef = inject(MatDialogRef<TeamFormDialogComponent>);
  data = inject<TeamDialogData>(MAT_DIALOG_DATA);

  employees: Employee[] = [];

  form = this.fb.nonNullable.group({
    name: [this.data.team?.name ?? '', Validators.required],
    leaderId: [this.data.team?.leaderId ?? 0, Validators.required],
  });

  ngOnInit(): void {
    this.employeeService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => (this.employees = data));
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
