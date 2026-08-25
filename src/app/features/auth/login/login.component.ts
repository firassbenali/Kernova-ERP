import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-brand">
          <div class="brand-logo"><span>K</span></div>
          <h1>Krenova ERP</h1>
          <p>Sign in to your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              formControlName="password"
              autocomplete="current-password" />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              type="button"
              mat-icon-button
              matSuffix
              (click)="hidePassword = !hidePassword"
              [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'">
              <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
            </button>
          </mat-form-field>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="login-btn"
            [disabled]="form.invalid || loading">
            @if (loading) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Sign in
            }
          </button>
        </form>

        <div class="login-footer">
          <span>Don't have an account?</span>
          <a routerLink="/register">Sign up</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: 40px 36px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border-light);
    }

    .login-brand {
      text-align: center;
      margin-bottom: 32px;

      h1 {
        font-size: 24px;
        font-weight: 700;
        margin: 16px 0 4px;
        color: var(--color-text-primary);
      }

      p {
        color: var(--color-text-secondary);
        font-size: 14px;
      }
    }

    .brand-logo {
      width: 56px;
      height: 56px;
      background: var(--color-primary);
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      span {
        color: white;
        font-size: 28px;
        font-weight: 700;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .login-btn {
      margin-top: 8px;
      height: 44px;
      font-size: 15px;
    }

    .login-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 14px;
      color: var(--color-text-secondary);

      a {
        color: var(--color-primary);
        font-weight: 500;
        margin-left: 4px;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hidePassword = true;
  loading = false;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Invalid email or password. Please try again.', 'Dismiss', {
          duration: 5000,
        });
      },
    });
  }
}
