import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Skill, SkillCategory } from '../../../../domain/models/skill.model';

export interface SkillDialogData {
  skill?: Skill;
}

@Component({
  selector: 'app-skill-form-dialog',
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
    <h2 mat-dialog-title>{{ data.skill ? 'Edit Skill' : 'New Skill' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (cat of categories; track cat) {
              <mat-option [value]="cat">{{ cat }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Optional description"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Active</mat-label>
          <mat-select formControlName="active">
            <mat-option [value]="true">Yes</mat-option>
            <mat-option [value]="false">No</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.skill ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .w-full { width: 100%; }
    form { display: flex; flex-direction: column; gap: 16px; min-width: 350px; }
  `],
})
export class SkillFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<SkillFormDialogComponent>);
  data = inject<SkillDialogData>(MAT_DIALOG_DATA);

  categories = [
    SkillCategory.Technical,
    SkillCategory.SoftSkill,
    SkillCategory.Management,
    SkillCategory.Language,
    SkillCategory.Certification,
    SkillCategory.Domain,
  ];

  form = this.fb.nonNullable.group({
    name: [this.data.skill?.name ?? '', Validators.required],
    category: [this.data.skill?.category ?? SkillCategory.Technical, Validators.required],
    description: [this.data.skill?.description ?? ''],
    active: [this.data.skill?.active ?? true, Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}