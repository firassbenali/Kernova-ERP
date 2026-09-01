import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';

import { InvoiceService } from '../../../core/services/invoice.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ClientPortalService } from '../../../core/services/client-portal.service';
import { Invoice } from '../../../domain/models/invoice.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-portal-invoices',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DecimalPipe,
  ],
  template: `
    <div class="portal-section">
      <div class="section-header">
        <div>
          <h2>Mes Factures & Règlements</h2>
          <p class="subtitle">Téléchargez vos factures au format PDF et suivez l'état de vos règlements</p>
        </div>
      </div>

      <div class="portal-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && invoices().length === 0) {
          <app-empty-state
            icon="receipt"
            title="Aucune facture émise"
            message="Vos factures s'afficheront ici après la validation de vos contrats."
          />
        } @else {
          <table mat-table [dataSource]="invoices()" class="w-full">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>N° Facture</th>
              <td mat-cell *matCellDef="let row">
                <span class="ref-badge">{{ row.reference || 'FAC-' + row.idInvoice }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Date d'émission / Échéance</th>
              <td mat-cell *matCellDef="let row">
                Émise le {{ row.issueDate }} @if (row.dueDate) { (Échéance: {{ row.dueDate }}) }
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Montant HT</th>
              <td mat-cell *matCellDef="let row">{{ row.amount | number:'1.2-2' }} TND</td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total TTC</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ (row.total || row.amount) | number:'1.2-2' }} TND</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut de Paiement</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-pill" [class]="'pill-' + row.paymentStatus.toLowerCase()">
                  {{ row.paymentStatus === 'PAID' ? 'Réglée' : 'À Régler' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Télécharger</th>
              <td mat-cell *matCellDef="let row">
                <button mat-flat-button color="primary" class="btn-xs" (click)="downloadPdf(row)">
                  <mat-icon inline>picture_as_pdf</mat-icon> Télécharger PDF
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['reference', 'dates', 'amount', 'total', 'status', 'actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['reference', 'dates', 'amount', 'total', 'status', 'actions']"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .section-header { margin-bottom: 20px; h2 { margin: 0; font-size: 22px; color: #0f172a; } }
    .subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }
    .portal-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .w-full { width: 100%; }

    .ref-badge { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; color: #334155; font-weight: 600; }
    .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
    .pill-paid { background: #dcfce7; color: #15803d; }
    .pill-unpaid, .pill-overdue { background: #fee2e2; color: #b91c1c; }
    .btn-xs { font-size: 12px; line-height: 28px; padding: 0 10px; }
  `],
})
export class PortalInvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService);
  private clientPortalService = inject(ClientPortalService);

  loading = signal(true);
  invoices = signal<Invoice[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) {
        this.invoices.set([]);
        this.loading.set(false);
        return;
      }

      this.invoiceService.getAll(clientId).subscribe({
        next: res => {
          const filtered = (res || []).filter(i => i.clientId === clientId);
          this.invoices.set(filtered);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  downloadPdf(invoice: Invoice): void {
    if (!invoice.idInvoice) return;
    this.invoiceService.downloadPdf(invoice.idInvoice).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Facture-${invoice.reference || invoice.idInvoice}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
