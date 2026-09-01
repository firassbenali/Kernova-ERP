import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Client } from '../../../domain/models/client.model';

export interface ClientDialogData {
  client?: Client;
}

@Component({
  selector: 'app-client-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">{{ isEdit ? 'edit' : 'business' }}</mat-icon>
      {{ isEdit ? 'Modifier la fiche Client' : 'Nouveau Client' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Raison Sociale / Entreprise *</mat-label>
            <input matInput formControlName="companyName" placeholder="Ex: TechCorp SARL" />
            @if (form.get('companyName')?.hasError('required')) {
              <mat-error>La raison sociale est requise</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Email professionnel *</mat-label>
            <input matInput type="email" formControlName="email" placeholder="contact@entreprise.com" />
            @if (form.get('email')?.hasError('required')) {
              <mat-error>L'email est requis</mat-error>
            } @else if (form.get('email')?.hasError('email')) {
              <mat-error>Email invalide</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="phone" placeholder="+216 71 000 000" />
          </mat-form-field>
        </div>

        <!-- Section Création Compte Client (Espace Client) -->
        <div class="account-section">
          <div class="account-header">
            <mat-slide-toggle formControlName="createAccount" color="primary">
              <strong>Créer un compte d'accès Client (Portail Client)</strong>
            </mat-slide-toggle>
          </div>

          @if (form.get('createAccount')?.value) {
            <div class="form-row account-inputs">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Mot de passe initial *</mat-label>
                <input
                  matInput
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="initialPassword"
                  placeholder="Définir un mot de passe temporaire"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hidePassword = !hidePassword"
                >
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('initialPassword')?.hasError('required')) {
                  <mat-error>Le mot de passe est requis pour la création du compte</mat-error>
                } @else if (form.get('initialPassword')?.hasError('minlength')) {
                  <mat-error>Au moins 6 caractères requis</mat-error>
                }
              </mat-form-field>
            </div>
          }
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Secteur d'activité</mat-label>

            <mat-select formControlName="sector">
              <mat-option value="Informatique & IT">Informatique & IT</mat-option>
              <mat-option value="Finance & Banque">Finance & Banque</mat-option>
              <mat-option value="Industrie & BTP">Industrie & BTP</mat-option>
              <mat-option value="Santé & Pharma">Santé & Pharma</mat-option>
              <mat-option value="Commerce & Distribution">Commerce & Distribution</mat-option>
              <mat-option value="Services & Conseil">Services & Conseil</mat-option>
              <mat-option value="Autre">Autre</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Site Web</mat-label>
            <input matInput formControlName="website" placeholder="https://entreprise.com" />
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Source du Lead</mat-label>
            <mat-select formControlName="source">
              <mat-option value="Site Web">Site Web</mat-option>
              <mat-option value="Recommandation">Recommandation</mat-option>
              <mat-option value="Prospection">Prospection</mat-option>
              <mat-option value="Réseaux Sociaux">Réseaux Sociaux</mat-option>
              <mat-option value="Salon / Événement">Salon / Événement</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Score Lead (1 - 100)</mat-label>
            <input matInput type="number" formControlName="score" min="1" max="100" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Adresse</mat-label>
            <input matInput formControlName="address" placeholder="Rue, avenue..." />
          </mat-form-field>
        </div>

        <div class="form-row three-cols">
          <mat-form-field appearance="outline">
            <mat-label>Ville</mat-label>
            <input matInput formControlName="city" placeholder="Tunis, Paris..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Code Postal</mat-label>
            <input matInput formControlName="postalCode" placeholder="1000" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Pays</mat-label>
            <input matInput formControlName="country" placeholder="Tunisie, France..." />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description / Notes</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Informations complémentaires..."></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Créer le Client' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 12px !important;
      max-height: 75vh;
    }
    .form-row { display: flex; gap: 12px; }
    .w-full { width: 100%; }
    .two-cols > * { flex: 1; }
    .three-cols > * { flex: 1; }
    h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin: 0; }
    .account-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .account-header {
      margin-bottom: 8px;
    }
    .account-inputs {
      margin-top: 8px;
    }
  `],
})
export class ClientFormDialogComponent {
  dialogRef = inject(MatDialogRef<ClientFormDialogComponent>);
  data: ClientDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.client;
  hidePassword = true;

  form = this.fb.group({
    companyName: [this.data.client?.companyName || '', [Validators.required]],
    email: [this.data.client?.email || '', [Validators.required, Validators.email]],
    phone: [this.data.client?.phone || ''],
    fax: [this.data.client?.fax || ''],
    website: [this.data.client?.website || ''],
    sector: [this.data.client?.sector || 'Informatique & IT'],
    source: [this.data.client?.source || 'Site Web'],
    score: [this.data.client?.score || 50],
    address: [this.data.client?.address || ''],
    city: [this.data.client?.city || ''],
    postalCode: [this.data.client?.postalCode || ''],
    country: [this.data.client?.country || 'Tunisie'],
    description: [this.data.client?.description || ''],
    createAccount: [!this.isEdit],
    initialPassword: ['', [Validators.minLength(6)]],
  });

  constructor() {
    this.updatePasswordValidation(this.form.get('createAccount')?.value ?? false);

    this.form.get('createAccount')?.valueChanges.subscribe((create) => {
      this.updatePasswordValidation(!!create);
    });
  }

  private updatePasswordValidation(createAccount: boolean): void {
    const passwordCtrl = this.form.get('initialPassword');
    if (createAccount) {
      passwordCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      passwordCtrl?.clearValidators();
    }
    passwordCtrl?.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.valid) {
      const val = { ...this.form.value };
      if (!val.createAccount) {
        delete val.initialPassword;
      }
      this.dialogRef.close(val);
    }
  }
}
