import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Appointment } from '../../../domain/models/client.model';

export interface AppointmentDialogData {
  appointment?: Appointment;
}

@Component({
  selector: 'app-appointment-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">event</mat-icon>
      {{ isEdit ? 'Modifier le Rendez-vous' : 'Planifier un Rendez-vous' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Sujet / Motif *</mat-label>
            <input matInput formControlName="subject" placeholder="Ex: Démo produit, Négociation contrat" />
            @if (form.get('subject')?.hasError('required')) {
              <mat-error>Le sujet est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Date & Heure *</mat-label>
            <input matInput type="datetime-local" formControlName="appointmentDate" />
            @if (form.get('appointmentDate')?.hasError('required')) {
              <mat-error>La date est requise</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lieu / Canal</mat-label>
            <mat-select formControlName="location">
              <mat-option value="Bureau Client">Bureau Client</mat-option>
              <mat-option value="Nos Bureaux">Nos Bureaux</mat-option>
              <mat-option value="Visioconférence (Teams/Google Meet)">Visioconférence (Teams/Meet)</mat-option>
              <mat-option value="Téléphone">Téléphone</mat-option>
              <mat-option value="WhatsApp">WhatsApp</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="Pending">En attente (Pending)</mat-option>
              <mat-option value="Accepted">Accepté (Accepted)</mat-option>
              <mat-option value="Refused">Refusé (Refused)</mat-option>
              <mat-option value="Completed">Terminé (Completed)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description / Ordre du jour</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Planifier' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-content { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .form-row { display: flex; gap: 12px; }
    .w-full { width: 100%; }
    .two-cols > * { flex: 1; }
    h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin: 0; }
  `],
})
export class AppointmentFormDialogComponent {
  dialogRef = inject(MatDialogRef<AppointmentFormDialogComponent>);
  data: AppointmentDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.appointment;

  form = this.fb.group({
    subject: [this.data.appointment?.subject || '', [Validators.required]],
    appointmentDate: [this.data.appointment?.appointmentDate || '', [Validators.required]],
    location: [this.data.appointment?.location || 'Visioconférence (Teams/Google Meet)'],
    status: [this.data.appointment?.status || 'Pending'],
    description: [this.data.appointment?.description || ''],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
