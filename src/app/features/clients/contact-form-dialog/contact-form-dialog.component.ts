import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contact } from '../../../domain/models/client.model';

export interface ContactDialogData {
  contact?: Contact;
}

@Component({
  selector: 'app-contact-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">person_add</mat-icon>
      {{ isEdit ? 'Modifier le Contact' : 'Nouveau Contact' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Prénom *</mat-label>
            <input matInput formControlName="firstName" />
            @if (form.get('firstName')?.hasError('required')) {
              <mat-error>Le prénom est requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom *</mat-label>
            <input matInput formControlName="lastName" />
            @if (form.get('lastName')?.hasError('required')) {
              <mat-error>Le nom est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Poste / Fonction</mat-label>
            <input matInput formControlName="position" placeholder="Ex: Directeur Général" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Département</mat-label>
            <input matInput formControlName="department" placeholder="Ex: Achats, Direction" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email *</mat-label>
            <input matInput type="email" formControlName="email" />
            @if (form.get('email')?.hasError('required')) {
              <mat-error>L'email est requis</mat-error>
            } @else if (form.get('email')?.hasError('email')) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Téléphone fixe</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mobile</mat-label>
            <input matInput formControlName="mobile" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-checkbox formControlName="isPrimary" color="primary">
            Définir comme interlocuteur principal
          </mat-checkbox>
        </div>

        <div class="form-row" style="margin-top: 8px;">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Notes</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Ajouter Contact' }}
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
export class ContactFormDialogComponent {
  dialogRef = inject(MatDialogRef<ContactFormDialogComponent>);
  data: ContactDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.contact;

  form = this.fb.group({
    firstName: [this.data.contact?.firstName || '', [Validators.required]],
    lastName: [this.data.contact?.lastName || '', [Validators.required]],
    position: [this.data.contact?.position || ''],
    department: [this.data.contact?.department || ''],
    email: [this.data.contact?.email || '', [Validators.required, Validators.email]],
    phone: [this.data.contact?.phone || ''],
    mobile: [this.data.contact?.mobile || ''],
    isPrimary: [this.data.contact?.isPrimary || false],
    notes: [this.data.contact?.notes || ''],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
