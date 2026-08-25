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
import { Task, TaskPriority, TaskStatus } from '../../../domain/models/task.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { ProjectService } from '../../../core/services/project.service';
import { Employee } from '../../../domain/models/employee.model';
import { Project } from '../../../domain/models/project.model';

export interface TaskDialogData {
  task?: Task;
  projectId?: number;
}

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Component({
  selector: 'app-task-form-dialog',
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
    <h2 mat-dialog-title>{{ data.task ? 'Edit Task' : 'New Task' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Project</mat-label>
          <mat-select formControlName="projectId">
            @for (p of projects; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Assignee</mat-label>
          <mat-select formControlName="employeeId">
            @for (e of employees; track e.id) {
              <mat-option [value]="e.id">{{ e.username }}</mat-option>
            }
          </mat-select>
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
          <mat-label>Deadline</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="deadline" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.task ? 'Update' : 'Create' }}
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
  `],
})
export class TaskFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  dialogRef = inject(MatDialogRef<TaskFormDialogComponent>);
  data = inject<TaskDialogData>(MAT_DIALOG_DATA);

  employees: Employee[] = [];
  projects: Project[] = [];
  statuses = STATUSES;
  priorities = PRIORITIES;

  form = this.fb.nonNullable.group({
    title: [this.data.task?.title ?? '', Validators.required],
    description: [this.data.task?.description ?? ''],
    projectId: [
      this.data.task?.projectId ?? this.data.projectId ?? 0,
      Validators.required,
    ],
    employeeId: [this.data.task?.employeeId ?? 0, Validators.required],
    priority: [this.data.task?.priority ?? 'MEDIUM' as TaskPriority, Validators.required],
    status: [this.data.task?.status ?? 'TODO' as TaskStatus, Validators.required],
    deadline: [
      this.data.task?.deadline ? new Date(this.data.task.deadline) : new Date(),
    ],
  });

  constructor() {
    if (this.data.projectId) {
      this.form.controls.projectId.disable();
    }
  }

  ngOnInit(): void {
    this.employeeService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => (this.employees = data));
    this.projectService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => (this.projects = data));
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const deadline =
      raw.deadline instanceof Date
        ? raw.deadline.toISOString().split('T')[0]
        : String(raw.deadline);
    this.dialogRef.close({ ...raw, deadline });
  }
}
