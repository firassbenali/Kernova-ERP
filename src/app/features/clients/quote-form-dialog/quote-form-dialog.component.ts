import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Quote } from '../../../domain/models/quote.model';

export interface QuoteDialogData {
  quote?: Quote;
}

@Component({
  selector: 'app-quote-form-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
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
      <mat-icon color="primary">request_quote</mat-icon>
      {{ isEdit ? 'Modifier le Devis' : 'Créer un nouveau Devis' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Intitulé du Devis *</mat-label>
            <input matInput formControlName="title" placeholder="Ex: Déploiement ERP Module RH & CRM" />
            @if (form.get('title')?.hasError('required')) {
              <mat-error>L'intitulé est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row three-cols">
          <mat-form-field appearance="outline">
            <mat-label>Montant HT (DT/€) *</mat-label>
            <input matInput type="number" formControlName="amount" (input)="recalculateTotal()" />
            @if (form.get('amount')?.hasError('required')) {
              <mat-error>Le montant est requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>TVA (%)</mat-label>
            <input matInput type="number" formControlName="tax" (input)="recalculateTotal()" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Remise (DT/€)</mat-label>
            <input matInput type="number" formControlName="discount" (input)="recalculateTotal()" />
          </mat-form-field>
        </div>

        <div class="total-summary">
          <span>Montant Total TTC Estimé : </span>
          <strong>{{ totalTtc() | number:'1.2-2' }} TND</strong>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Date d'émission</mat-label>
            <input matInput type="date" formControlName="issueDate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date d'expiration</mat-label>
            <input matInput type="date" formControlName="expirationDate" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="Draft">Brouillon (Draft)</mat-option>
              <mat-option value="Sent">Envoyé au Client (Sent)</mat-option>
              <mat-option value="Accepted">Accepté par Client (Accepted)</mat-option>
              <mat-option value="Refused">Refusé (Refused)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Créer le Devis' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-content { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; }
    .form-row { display: flex; gap: 12px; }
    .w-full { width: 100%; }
    .two-cols > * { flex: 1; }
    .three-cols > * { flex: 1; }
    h2 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin: 0; }
    .total-summary {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 12px;
      font-size: 14px;
      color: #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      strong { color: #1e40af; font-size: 16px; }
    }
  `],
})
export class QuoteFormDialogComponent {
  dialogRef = inject(MatDialogRef<QuoteFormDialogComponent>);
  data: QuoteDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.quote;

  form = this.fb.group({
    title: [this.data.quote?.title || '', [Validators.required]],
    amount: [this.data.quote?.amount || 0, [Validators.required, Validators.min(0)]],
    tax: [this.data.quote?.tax || 19],
    discount: [this.data.quote?.discount || 0],
    issueDate: [this.data.quote?.issueDate || new Date().toISOString().substring(0, 10)],
    expirationDate: [this.data.quote?.expirationDate || ''],
    status: [this.data.quote?.status || 'Draft'],
  });

  recalculateTotal(): number {
    const amount = Number(this.form.value.amount || 0);
    const taxPct = Number(this.form.value.tax || 0);
    const discount = Number(this.form.value.discount || 0);
    const taxAmount = (amount * taxPct) / 100;
    return amount + taxAmount - discount;
  }

  totalTtc(): number {
    return this.recalculateTotal();
  }

  submit(): void {
    if (this.form.valid) {
      const val = {
        ...this.form.value,
        total: this.recalculateTotal(),
      };
      this.dialogRef.close(val);
    }
  }
}
