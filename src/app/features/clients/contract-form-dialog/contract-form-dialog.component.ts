import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contract } from '../../../domain/models/contract.model';

export interface ContractDialogData {
  contract?: Contract;
  quoteId?: number;
  amount?: number;
}

@Component({
  selector: 'app-contract-form-dialog',
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
      <mat-icon color="primary">description</mat-icon>
      {{ isEdit ? 'Modifier le Contrat' : 'Créer un nouveau Contrat' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Titre / Objet du Contrat *</mat-label>
            <input matInput formControlName="title" placeholder="Ex: Contrat de Prestation de Services ERP" />
            @if (form.get('title')?.hasError('required')) {
              <mat-error>Le titre est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Type de Contrat</mat-label>
            <mat-select formControlName="contractType">
              <mat-option value="Prestation de Service">Prestation de Service</mat-option>
              <mat-option value="Licence Logiciel">Licence Logiciel</mat-option>
              <mat-option value="Maintenance & Support">Maintenance & Support</mat-option>
              <mat-option value="Partenariat">Partenariat</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Montant Engagé (HT) *</mat-label>
            <input matInput type="number" formControlName="amount" />
            @if (form.get('amount')?.hasError('required')) {
              <mat-error>Le montant est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Date de début</mat-label>
            <input matInput type="date" formControlName="startDate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date de fin</mat-label>
            <input matInput type="date" formControlName="endDate" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="Draft">Brouillon (Draft)</mat-option>
              <mat-option value="Sent">Envoyé pour Signature (Sent)</mat-option>
              <mat-option value="Signed">Signé (Signed)</mat-option>
              <mat-option value="Expired">Expiré (Expired)</mat-option>
              <mat-option value="Cancelled">Annulé (Cancelled)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description & Clauses particulières</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Générer Contrat' }}
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
export class ContractFormDialogComponent {
  dialogRef = inject(MatDialogRef<ContractFormDialogComponent>);
  data: ContractDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.contract;

  form = this.fb.group({
    title: [this.data.contract?.title || '', [Validators.required]],
    contractType: [this.data.contract?.contractType || 'Prestation de Service'],
    amount: [this.data.contract?.amount || this.data.amount || 0, [Validators.required]],
    currency: [this.data.contract?.currency || 'TND'],
    startDate: [this.data.contract?.startDate || new Date().toISOString().substring(0, 10)],
    endDate: [this.data.contract?.endDate || ''],
    status: [this.data.contract?.status || 'Draft'],
    description: [this.data.contract?.description || ''],
    quoteId: [this.data.quoteId || this.data.contract?.quoteId || null],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
