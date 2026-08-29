import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Invoice } from '../../../domain/models/invoice.model';

export interface InvoiceDialogData {
  invoice?: Invoice;
  contractId?: number;
  amount?: number;
}

@Component({
  selector: 'app-invoice-form-dialog',
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
      <mat-icon color="primary">receipt_long</mat-icon>
      {{ isEdit ? 'Modifier la Facture' : 'Générer une Facture' }}
    </h2>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-content">
        <div class="form-row three-cols">
          <mat-form-field appearance="outline">
            <mat-label>Montant HT *</mat-label>
            <input matInput type="number" formControlName="amount" (input)="recalculate()" />
            @if (form.get('amount')?.hasError('required')) {
              <mat-error>Le montant est requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>TVA (%)</mat-label>
            <input matInput type="number" formControlName="tax" (input)="recalculate()" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Total TTC (TND)</mat-label>
            <input matInput type="number" formControlName="total" readonly />
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>Date d'émission</mat-label>
            <input matInput type="date" formControlName="issueDate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date d'échéance</mat-label>
            <input matInput type="date" formControlName="dueDate" />
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Statut de paiement</mat-label>
            <mat-select formControlName="paymentStatus">
              <mat-option value="UNPAID">Non Payée (UNPAID)</mat-option>
              <mat-option value="PARTIALLY_PAID">Partiellement Payée (PARTIALLY_PAID)</mat-option>
              <mat-option value="PAID">Payée (PAID)</mat-option>
              <mat-option value="OVERDUE">En Retard (OVERDUE)</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Annuler</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Enregistrer' : 'Émettre la Facture' }}
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
  `],
})
export class InvoiceFormDialogComponent {
  dialogRef = inject(MatDialogRef<InvoiceFormDialogComponent>);
  data: InvoiceDialogData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEdit = !!this.data.invoice;

  form = this.fb.group({
    amount: [this.data.invoice?.amount || this.data.amount || 0, [Validators.required, Validators.min(0)]],
    tax: [this.data.invoice?.tax || 19],
    total: [this.data.invoice?.total || 0],
    issueDate: [this.data.invoice?.issueDate || new Date().toISOString().substring(0, 10)],
    dueDate: [this.data.invoice?.dueDate || ''],
    paymentStatus: [this.data.invoice?.paymentStatus || 'UNPAID'],
    contractId: [this.data.contractId || this.data.invoice?.contractId || null],
  });

  ngOnInit() {
    this.recalculate();
  }

  recalculate(): void {
    const amt = Number(this.form.value.amount || 0);
    const taxPct = Number(this.form.value.tax || 0);
    const total = amt + (amt * taxPct) / 100;
    this.form.patchValue({ total: Math.round(total * 100) / 100 }, { emitEvent: false });
  }

  submit(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
