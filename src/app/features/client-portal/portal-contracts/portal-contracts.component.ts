import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe } from '@angular/common';

import { ContractService } from '../../../core/services/contract.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Contract } from '../../../domain/models/contract.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SignContractDialogComponent } from '../../clients/sign-contract-dialog/sign-contract-dialog.component';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-portal-contracts',
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
          <h2>Mes Contrats & Engagements</h2>
          <p class="subtitle">Consultez vos contrats et validez par signature électronique</p>
        </div>
      </div>

      <div class="portal-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && contracts().length === 0) {
          <app-empty-state
            icon="description"
            title="Aucun contrat disponible"
            message="Vos contrats d'engagement apparaîtront ici dès leur validation."
          />
        } @else {
          <table mat-table [dataSource]="contracts()" class="w-full">
            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>N° Contrat</th>
              <td mat-cell *matCellDef="let row">
                <span class="ref-badge">{{ row.reference || 'CNT-' + row.idContract }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Titre du Contrat</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ row.title }}</strong>
                <div class="sub-text">{{ row.contractType }}</div>
              </td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Montant Engagé</th>
              <td mat-cell *matCellDef="let row">
                <strong>{{ row.amount | number:'1.2-2' }} TND</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="signature">
              <th mat-header-cell *matHeaderCellDef>Statut Signature</th>
              <td mat-cell *matCellDef="let row">
                @if (row.signedBy) {
                  <div class="signed-box">
                    <mat-icon inline color="primary">verified</mat-icon> Signé par {{ row.signedBy }}
                    <div class="sub-text">le {{ row.signedDate }}</div>
                  </div>
                } @else {
                  <span class="unsigned-badge">À Signer</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="downloadPdf(row)" matTooltip="Télécharger Contrat PDF">
                  <mat-icon color="primary">picture_as_pdf</mat-icon>
                </button>

                @if (!row.signedBy && row.status !== 'Signed') {
                  <button mat-flat-button color="accent" class="btn-xs" (click)="signContract(row)">
                    <mat-icon inline>draw</mat-icon> Signer le Contrat
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['reference', 'title', 'amount', 'signature', 'actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['reference', 'title', 'amount', 'signature', 'actions']"></tr>
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
    .sub-text { font-size: 11px; color: #64748b; }

    .signed-box { font-size: 12px; font-weight: 600; color: #15803d; }
    .unsigned-badge { background: #fef3c7; color: #d97706; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 700; }
    .btn-xs { font-size: 12px; line-height: 28px; padding: 0 12px; margin-left: 6px; }
  `],
})
export class PortalContractsComponent implements OnInit {
  private contractService = inject(ContractService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  contracts = signal<Contract[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const clientId = this.authService.currentUser()?.id;
    if (!clientId) {
      this.contracts.set([]);
      this.loading.set(false);
      return;
    }

    this.contractService.getAll(clientId).subscribe({
      next: res => {
        const filtered = (res || []).filter(c => c.clientId === clientId);
        this.contracts.set(filtered);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  signContract(contract: Contract): void {
    if (!contract.idContract) return;

    this.dialog
      .open(SignContractDialogComponent, { width: '480px', data: { contract } })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(signedBy => this.contractService.signContract(contract.idContract!, signedBy))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contrat signé électroniquement avec succès ! Merci pour votre confiance.', 'OK', { duration: 4000 });
          this.load();
        },
      });
  }

  downloadPdf(contract: Contract): void {
    if (!contract.idContract) return;
    this.contractService.downloadPdf(contract.idContract).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Contrat-${contract.reference || contract.idContract}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
