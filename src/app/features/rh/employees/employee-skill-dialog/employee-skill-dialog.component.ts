import { Component, Inject, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SkillService } from '../../../../core/services/skill.service';
import { Skill } from '../../../../domain/models/skill.model';
import { SkillLevel } from '../../../../domain/models/employee-skill.model';

export interface EmployeeSkillDialogData {
  employeeId: number;
  existingSkillIds: number[];
  skill?: { skillId: number; level: SkillLevel; targetLevel?: SkillLevel; yearsOfExperience?: number };
}

const LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

@Component({
  selector: 'app-employee-skill-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.skill ? 'Edit Competency' : 'Assign Skill' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Skill</mat-label>
          <mat-select formControlName="skillId" [disabled]="!!data.skill">
            @for (s of availableSkills; track s.id) {
              <mat-option [value]="s.id">{{ s.name }} ({{ s.category }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Current Level</mat-label>
          <mat-select formControlName="level">
            @for (l of levels; track l) {
              <mat-option [value]="l">{{ l }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Target Level</mat-label>
          <mat-select formControlName="targetLevel">
            <mat-option value="">Not set</mat-option>
            @for (l of levels; track l) {
              <mat-option [value]="l">{{ l }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Years of Experience</mat-label>
          <input matInput type="number" formControlName="yearsOfExperience" min="0" max="50" placeholder="Optional">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data.skill ? 'Update' : 'Assign' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .w-full { width: 100%; }
    form { display: flex; flex-direction: column; gap: 16px; min-width: 350px; }
  `],
})
export class EmployeeSkillDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private skillService = inject(SkillService);
  dialogRef = inject(MatDialogRef<EmployeeSkillDialogComponent>);

  skills: Skill[] = [];
  levels = LEVELS;

  form = this.fb.nonNullable.group({
    skillId: [0, Validators.required],
    level: ['BEGINNER' as SkillLevel, Validators.required],
    targetLevel: ['' as SkillLevel | ''],
    yearsOfExperience: [0, [Validators.min(0), Validators.max(50)]],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: EmployeeSkillDialogData) {}

  get availableSkills(): Skill[] {
    if (this.data.skill) {
      return this.skills.filter(s => s.id === this.data.skill!.skillId || !this.data.existingSkillIds.includes(s.id));
    }
    return this.skills.filter(s => !this.data.existingSkillIds.includes(s.id));
  }

  ngOnInit(): void {
    this.skillService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(skills => {
        this.skills = skills;
        if (this.data.skill) {
          this.form.patchValue({
            skillId: this.data.skill!.skillId,
            level: this.data.skill!.level,
            targetLevel: this.data.skill!.targetLevel || '',
            yearsOfExperience: this.data.skill!.yearsOfExperience || 0,
          });
        }
      });
  }

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}