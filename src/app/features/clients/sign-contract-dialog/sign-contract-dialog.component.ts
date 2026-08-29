import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contract } from '../../../domain/models/contract.model';

export interface SignContractDialogData {
  contract: Contract;
}

@Component({
  selector: 'app-sign-contract-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="primary">draw</mat-icon>
      Signature Électronique de Contrat
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="contract-box">
          <div class="contract-title">{{ data.contract.title }}</div>
          <div class="contract-ref">Référence : {{ data.contract.reference || 'CNT-' + data.contract.idContract }}</div>
          <div class="contract-amount">Montant Engagé : <strong>{{ data.contract.amount | number:'1.2-2' }} TND</strong></div>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Signé par (Nom complet du représentant client) *</mat-label>
            <input matInput formControlName="signedBy" placeholder="Ex: Jean Dupont (CEO)" />
            @if (form.get('signedBy')?.hasError('required')) {
              <mat-error>Le nom du signataire est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="legal-notice">
          <mat-icon>verified</mat-icon>
          <span>En validant, le contrat prend un statut <strong>Signé (Signed)</strong> et devient juridiquement valide.</span>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          <mat-icon>draw</mat-icon> Valider la Signature
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-content { display: flex; flex-direction: column; gap: 12px; padding-top: 12px !important; }
    .contract-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 12px 16px;
      border-radius: 8px;
    }
    .contract-title { font-weight: 700; color: #1e40af; font-size: 15px; }
    .contract-ref { font-size: 12px; color: #3b82f6; }
    .contract-amount { font-size: 13px; margin-top: 4px; color: #1e3a8a; }
    .w-full { width: 100%; }
    .legal-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #15803d; }
    }
    h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin: 0; }
  `],
})
export class SignContractDialogComponent {
  dialogRef = inject(MatDialogRef<SignContractDialogComponent>);
  data: SignContractDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    signedBy: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.signedBy);
    }
  }
}
