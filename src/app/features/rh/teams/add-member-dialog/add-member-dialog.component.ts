import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Employee } from '../../../../domain/models/employee.model';

export interface AddMemberDialogData {
  employees: Employee[];
}

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Add Team Member</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Employee</mat-label>
        <mat-select #employeeSelect>
          @for (e of data.employees; track e.id) {
            <mat-option [value]="e.id">{{ e.username }} ({{ e.userEmail }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (data.employees.length === 0) {
        <p class="no-employees">All employees are already in this team.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="data.employees.length === 0 || !employeeSelect.value"
        (click)="dialogRef.close(employeeSelect.value)">
        Add
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .no-employees {
      color: var(--color-text-secondary);
      font-size: 14px;
    }
  `],
})
export class AddMemberDialogComponent {
  dialogRef = inject(MatDialogRef<AddMemberDialogComponent>);
  data = inject<AddMemberDialogData>(MAT_DIALOG_DATA);
}
