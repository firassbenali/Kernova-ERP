import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserResponse } from '../../../domain/models/user.model';

export interface UserDialogData {
  user?: UserResponse;
}

export interface UserDialogResult {
  username: string;
  email: string;
  password?: string;
  roleId: number;
}

@Component({
  selector: 'app-user-form-dialog',
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
    <h2 mat-dialog-title>{{ data.user ? 'Edit User' : 'New User' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="off" />
          @if (form.controls.email.errors?.['email']) {
            <mat-error>Enter a valid email address</mat-error>
          }
        </mat-form-field>

        @if (!data.user) {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            @if (form.controls.password.errors?.['minlength']) {
              <mat-error>Password must be at least 6 characters</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Role</mat-label>
          <mat-select formControlName="roleId">
            <mat-option [value]="1">ADMIN</mat-option>
            <mat-option [value]="2">EMPLOYEE</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.user ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 8px;
    }
  `],
})
export class UserFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  data = inject<UserDialogData>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    username: [this.data.user?.username ?? '', Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    password: ['', this.data.user ? [] : [Validators.required, Validators.minLength(6)]],
    roleId: [this.data.user?.role === 'ADMIN' ? 1 : 2, Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    const result: UserDialogResult = {
      username: value.username,
      email: value.email,
      roleId: value.roleId,
    };
    if (value.password) {
      result.password = value.password;
    }
    this.dialogRef.close(result);
  }
}
