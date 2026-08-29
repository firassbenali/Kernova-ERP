import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';

import { QuoteService } from '../../../core/services/quote.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Quote } from '../../../domain/models/quote.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-portal-quotes',
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
          <h2>Mes Devis Commerciales</h2>
          <p class="subtitle">Examinez les propositions tarifaires et confirmez votre accord en 1-clic</p>
        </div>
      </div>

      <div class="portal-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && quotes().length === 0) {
          <app-empty-state
            icon="request_quote"
            title="Aucun devis disponible"
            message="Vous n'avez aucun devis en cours d'étude pour le moment."
          />
        } @else {
          <table mat-table [dataSource]="quotes()" class="w-full">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>N° Devis</th>
              <td mat-cell *matCellDef="let row">
                <span class="ref-badge">{{ row.reference || 'DEV-' + row.idQuote }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Objet du Devis</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ row.title }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Montant Total TTC</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ (row.total || row.amount) | number:'1.2-2' }} TND</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Validité</th>
              <td mat-cell *matCellDef="let row">
                Valable jusqu'au {{ row.expirationDate || 'N/A' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-pill" [class]="'pill-' + row.status.toLowerCase()">
                  {{ row.status === 'Sent' ? 'En attente de votre réponse' : row.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="downloadPdf(row)" matTooltip="Télécharger Devis PDF">
                  <mat-icon color="primary">picture_as_pdf</mat-icon>
                </button>

                @if (row.status === 'Sent' || row.status === 'Draft') {
                  <button mat-flat-button color="primary" class="btn-xs" (click)="acceptQuote(row)">
                    <mat-icon inline>check</mat-icon> Accepter
                  </button>
                  <button mat-stroked-button color="warn" class="btn-xs" (click)="refuseQuote(row)">
                    Refuser
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['reference', 'title', 'amount', 'dates', 'status', 'actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['reference', 'title', 'amount', 'dates', 'status', 'actions']"></tr>
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
    .pill-accepted { background: #dcfce7; color: #15803d; }
    .pill-refused { background: #fee2e2; color: #b91c1c; }
    .pill-sent, .pill-draft { background: #e0f2fe; color: #0369a1; }
    .btn-xs { font-size: 12px; line-height: 28px; padding: 0 10px; margin-left: 6px; }
  `],
})
export class PortalQuotesComponent implements OnInit {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  quotes = signal<Quote[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const clientId = this.authService.currentUser()?.id;
    if (!clientId) {
      this.quotes.set([]);
      this.loading.set(false);
      return;
    }

    this.quoteService.getAll(clientId).subscribe({
      next: res => {
        const filtered = (res || []).filter(q => q.clientId === clientId);
        this.quotes.set(filtered);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  acceptQuote(quote: Quote): void {
    if (!quote.idQuote) return;
    this.quoteService.updateStatus(quote.idQuote, 'Accepted').subscribe({
      next: () => {
        this.snackBar.open('Vous avez accepté ce devis ! Notre équipe prépare votre contrat.', 'OK', { duration: 4000 });
        this.load();
      },
    });
  }

  refuseQuote(quote: Quote): void {
    if (!quote.idQuote) return;
    this.quoteService.updateStatus(quote.idQuote, 'Refused').subscribe({
      next: () => {
        this.snackBar.open('Devis marqué comme refusé.', 'OK', { duration: 3000 });
        this.load();
      },
    });
  }

  downloadPdf(quote: Quote): void {
    if (!quote.idQuote) return;
    this.quoteService.downloadPdf(quote.idQuote).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Devis-${quote.reference || quote.idQuote}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
