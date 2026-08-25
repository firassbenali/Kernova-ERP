import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { Employee } from '../../../../domain/models/employee.model';
import {
  CreatePerformanceReviewRequest,
  EvaluationRequest,
  PerformanceCriterion,
  PerformanceReview,
  UpdatePerformanceReviewRequest,
} from '../../../../domain/models/performance.model';

export interface PerformanceDialogData {
  review?: PerformanceReview;
  employees: Employee[];
  criteria$: Observable<PerformanceCriterion[]>;
}

export interface PerformanceDialogResult {
  review?: PerformanceReview;
  request: CreatePerformanceReviewRequest | UpdatePerformanceReviewRequest;
}

interface ScoreGroup {
  criterionId: number;
  weight: number;
  score: FormControl<number | null>;
  comment: FormControl<string | null>;
}

@Component({
  selector: 'app-performance-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.review ? 'Edit Review' : 'New Review' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Employee</mat-label>
          <mat-select formControlName="employeeId">
            @for (employee of data.employees; track employee.id) {
              <mat-option [value]="employee.id">{{ employee.username }}</mat-option>
            }
          </mat-select>
          @if (form.controls.employeeId.hasError('required')) {
            <mat-error>Employee is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Reviewer</mat-label>
          <mat-select formControlName="reviewerId">
            <mat-option [value]="null">None</mat-option>
            @for (employee of data.employees; track employee.id) {
              <mat-option [value]="employee.id">{{ employee.username }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Review period</mat-label>
          <input matInput formControlName="reviewPeriod" placeholder="e.g. Q1-2026" />
          @if (form.controls.reviewPeriod.hasError('required')) {
            <mat-error>Period is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Review date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="reviewDate" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          @if (form.controls.reviewDate.hasError('required')) {
            <mat-error>Date is required</mat-error>
          }
        </mat-form-field>

        <h3 class="section-title">Evaluations</h3>
        <p class="section-hint">Score each criterion from 0 to 100. The overall score is computed automatically using criterion weights.</p>

        @if (!loadingCriteria()) {
          @for (group of scoreGroups; track group.criterionId) {
            <div class="criterion-row">
              <div class="criterion-row__name">
                {{ criterionNames[group.criterionId] }}
                <mat-chip class="weight-chip">x{{ group.weight }}</mat-chip>
              </div>
              <mat-form-field appearance="outline" class="criterion-row__score">
                <mat-label>Score</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  max="100"
                  [formControl]="group.score"
                  [errorStateMatcher]="matcher"
                />
                @if (group.score.hasError('rangeError')) {
                  <mat-error>Score must be between 0 and 100</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline" class="criterion-row__comment">
                <mat-label>Comment (optional)</mat-label>
                <input matInput [formControl]="group.comment" maxlength="500" />
              </mat-form-field>
            </div>
          }
        } @else {
          <p class="section-hint">Loading criteria…</p>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comments</mat-label>
          <textarea matInput formControlName="comments" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Strengths</mat-label>
          <textarea matInput formControlName="strengths" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Improvement areas</mat-label>
          <textarea matInput formControlName="improvementAreas" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || loadingCriteria()" (click)="save()">
        {{ data.review ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 16px;
        min-width: 560px;
      }
      .full-width { grid-column: 1 / -1; }
      .section-title { grid-column: 1 / -1; margin: 8px 0 0; font-size: 14px; font-weight: 600; }
      .section-hint { grid-column: 1 / -1; margin: 0; font-size: 12px; color: var(--color-text-muted); }
      .criterion-row {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: 1fr 110px 1fr;
        gap: 12px;
        align-items: center;
      }
      .criterion-row__name { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 500; }
      .weight-chip { font-size: 11px; min-height: 20px; padding: 0 8px; }
      mat-form-field { width: 100%; }
    `,
  ],
})
export class PerformanceFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  matcher: { isErrorState: (control: FormControl | null) => boolean } = {
    isErrorState: (control: FormControl | null) => !!control && control.invalid && (control.dirty || control.touched),
  };

  dialogRef = inject(MatDialogRef<PerformanceFormDialogComponent, PerformanceDialogResult>);
  data = inject<PerformanceDialogData>(MAT_DIALOG_DATA);

  loadingCriteria = signal(true);
  scoreGroups: ScoreGroup[] = [];
  criterionNames: Record<number, string> = {};

  form = this.fb.nonNullable.group({
    employeeId: this.fb.nonNullable.control<number | null>(this.data.review?.employeeId ?? null, Validators.required),
    reviewerId: this.fb.nonNullable.control<number | null>(this.data.review?.reviewerId ?? null),
    reviewPeriod: this.fb.nonNullable.control(this.data.review?.reviewPeriod ?? '', [
      Validators.required,
      Validators.maxLength(50),
    ]),
    reviewDate: this.fb.nonNullable.control<Date>(
      this.data.review?.reviewDate ? new Date(this.data.review.reviewDate) : new Date(),
      Validators.required
    ),
    comments: this.fb.nonNullable.control(this.data.review?.comments ?? ''),
    strengths: this.fb.nonNullable.control(this.data.review?.strengths ?? ''),
    improvementAreas: this.fb.nonNullable.control(this.data.review?.improvementAreas ?? ''),
  });

  ngOnInit(): void {
    this.data.criteria$.subscribe(criteria => {
      const existing = new Map(
        (this.data.review?.evaluations ?? []).map(evaluation => [evaluation.criterionId, evaluation])
      );
      this.scoreGroups = criteria.map(criterion => {
        const previous = existing.get(criterion.id);
        return {
          criterionId: criterion.id,
          weight: criterion.weight,
          score: new FormControl<number | null>(
            previous?.score ?? null,
            control => {
              const value = control.value;
              if (value == null) return null;
              return value < 0 || value > 100 ? { rangeError: true } : null;
            }
          ),
          comment: new FormControl<string | null>(previous?.comment ?? null),
        };
      });
      criteria.forEach(criterion => (this.criterionNames[criterion.id] = criterion.name));
      this.loadingCriteria.set(false);
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const evaluations: EvaluationRequest[] = this.scoreGroups
      .filter(group => group.score.value != null)
      .map(group => ({
        criterionId: group.criterionId,
        score: group.score.value!,
        comment: group.comment.value ?? undefined,
      }));

    if (this.data.review) {
      const request: UpdatePerformanceReviewRequest = {
        reviewerId: raw.reviewerId ?? undefined,
        reviewPeriod: raw.reviewPeriod,
        reviewDate: this.toDateOnly(raw.reviewDate),
        comments: raw.comments || undefined,
        strengths: raw.strengths || undefined,
        improvementAreas: raw.improvementAreas || undefined,
        evaluations,
      };
      this.dialogRef.close({ review: this.data.review, request });
    } else {
      const request: CreatePerformanceReviewRequest = {
        employeeId: raw.employeeId!,
        reviewerId: raw.reviewerId ?? undefined,
        reviewPeriod: raw.reviewPeriod,
        reviewDate: this.toDateOnly(raw.reviewDate),
        comments: raw.comments || undefined,
        strengths: raw.strengths || undefined,
        improvementAreas: raw.improvementAreas || undefined,
        evaluations,
      };
      this.dialogRef.close({ request });
    }
  }

  private toDateOnly(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
