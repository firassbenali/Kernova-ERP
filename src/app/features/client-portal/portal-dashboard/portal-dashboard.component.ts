import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, DecimalPipe } from '@angular/common';

import { AuthService } from '../../../core/auth/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { QuoteService } from '../../../core/services/quote.service';
import { ContractService } from '../../../core/services/contract.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { ClientPortalService } from '../../../core/services/client-portal.service';

import { Appointment } from '../../../domain/models/client.model';
import { Quote } from '../../../domain/models/quote.model';
import { Contract } from '../../../domain/models/contract.model';
import { Invoice } from '../../../domain/models/invoice.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    LoadingOverlayComponent,
    DatePipe,
    DecimalPipe,
  ],
  template: `
    <div class="dashboard-portal">
      <!-- Welcome Hero Banner -->
      <div class="welcome-banner">
        <div class="banner-text">
          <h1>Bienvenue sur votre Espace Client</h1>
          <p>Consultez l'avancement de votre dossier, vos rendez-vous, devis, contrats et factures en toute sécurité.</p>
        </div>
        <div class="banner-badge">
          <mat-icon>verified_user</mat-icon> Compte Vérifié
        </div>
      </div>

      <!-- Quick KPI Stats Grid -->
      <div class="kpi-grid">
        <div class="kpi-card" routerLink="/portal/appointments">
          <div class="kpi-icon kpi-blue"><mat-icon>event</mat-icon></div>
          <div class="kpi-info">
            <span class="kpi-value">{{ pendingAppointments() }}</span>
            <span class="kpi-label">Rendez-vous à Venir</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/portal/quotes">
          <div class="kpi-icon kpi-orange"><mat-icon>request_quote</mat-icon></div>
          <div class="kpi-info">
            <span class="kpi-value">{{ pendingQuotes() }}</span>
            <span class="kpi-label">Devis en Attente de Validation</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/portal/contracts">
          <div class="kpi-icon kpi-purple"><mat-icon>draw</mat-icon></div>
          <div class="kpi-info">
            <span class="kpi-value">{{ unsignedContracts() }}</span>
            <span class="kpi-label">Contrats à Signer</span>
          </div>
        </div>

        <div class="kpi-card" routerLink="/portal/invoices">
          <div class="kpi-icon kpi-green"><mat-icon>receipt_long</mat-icon></div>
          <div class="kpi-info">
            <span class="kpi-value">{{ unpaidInvoices() }}</span>
            <span class="kpi-label">Factures à Régler</span>
          </div>
        </div>
      </div>

      <!-- Main Dashboard Sections -->
      <div class="sections-grid">
        <!-- Action items / Pending Approvals -->
        <div class="portal-card">
          <div class="card-header">
            <h3><mat-icon inline color="primary">assignment_late</mat-icon> Actions Requises</h3>
          </div>

          @if (loading()) {
            <app-loading-overlay [loading]="true" />
          } @else if (pendingQuotesList().length === 0 && unsignedContractsList().length === 0) {
            <div class="empty-box">
              <mat-icon color="primary">check_circle</mat-icon>
              <span>Aucune action urgente en attente. Tout votre dossier est à jour !</span>
            </div>
          } @else {
            <div class="actions-list">
              @for (q of pendingQuotesList(); track q.idQuote) {
                <div class="action-item">
                  <div class="item-icon quote-ic"><mat-icon>request_quote</mat-icon></div>
                  <div class="item-details">
                    <div class="item-title">Devis à valider : {{ q.title }}</div>
                    <div class="item-sub">Montant Total TTC : <strong>{{ (q.total || q.amount) | number:'1.2-2' }} TND</strong></div>
                  </div>
                  <button mat-flat-button color="primary" routerLink="/portal/quotes">Consulter Devis</button>
                </div>
              }

              @for (c of unsignedContractsList(); track c.idContract) {
                <div class="action-item">
                  <div class="item-icon contract-ic"><mat-icon>draw</mat-icon></div>
                  <div class="item-details">
                    <div class="item-title">Contrat à signer : {{ c.title }}</div>
                    <div class="item-sub">Montant Engagé : <strong>{{ c.amount | number:'1.2-2' }} TND</strong></div>
                  </div>
                  <button mat-flat-button color="accent" routerLink="/portal/contracts">Signer Contrat</button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Quick Links Card -->
        <div class="portal-card">
          <div class="card-header">
            <h3><mat-icon inline color="primary">touch_app</mat-icon> Accès Rapide</h3>
          </div>
          <div class="quick-links">
            <a routerLink="/portal/appointments" class="link-card">
              <mat-icon color="primary">event_available</mat-icon>
              <div>
                <strong>Demander un Rendez-vous</strong>
                <span>Planifier une démo ou une réunion téléphonique</span>
              </div>
            </a>

            <a routerLink="/portal/documents" class="link-card">
              <mat-icon color="accent">cloud_upload</mat-icon>
              <div>
                <strong>Déposer un Document</strong>
                <span>Téléverser des pièces justificatives</span>
              </div>
            </a>

            <a routerLink="/portal/invoices" class="link-card">
              <mat-icon style="color: #10b981">picture_as_pdf</mat-icon>
              <div>
                <strong>Télécharger mes Factures</strong>
                <span>Obtenir mes reçus et factures au format PDF</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .welcome-banner {
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white;
      padding: 32px 36px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
      margin-bottom: 24px;
    }
    .banner-text h1 { margin: 0 0 8px; font-size: 26px; }
    .banner-text p { margin: 0; opacity: 0.9; font-size: 14px; max-width: 650px; }
    .banner-badge {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: white;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
    }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .kpi-blue { background: #2563eb; }
    .kpi-orange { background: #ea580c; }
    .kpi-purple { background: #7c3aed; }
    .kpi-green { background: #059669; }

    .kpi-info { display: flex; flex-direction: column; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #0f172a; }
    .kpi-label { font-size: 12px; color: #64748b; }

    .sections-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .portal-card {
      background: white;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      padding: 24px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .card-header h3 { margin: 0 0 20px; font-size: 18px; color: #0f172a; display: flex; align-items: center; gap: 8px; }

    .empty-box {
      display: flex; align-items: center; gap: 12px; background: #f0fdf4; border: 1px solid #bbf7d0;
      padding: 16px; border-radius: 10px; color: #166534; font-weight: 500; font-size: 14px;
    }

    .actions-list { display: flex; flex-direction: column; gap: 12px; }
    .action-item {
      display: flex; align-items: center; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 14px 18px; border-radius: 10px;
    }
    .item-icon {
      width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;
    }
    .quote-ic { background: #f97316; }
    .contract-ic { background: #8b5cf6; }
    .item-details { flex: 1; }
    .item-title { font-weight: 700; color: #0f172a; font-size: 14px; }
    .item-sub { font-size: 12px; color: #64748b; }

    .quick-links { display: flex; flex-direction: column; gap: 12px; }
    .link-card {
      display: flex; align-items: center; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 14px; border-radius: 10px; text-decoration: none; color: #0f172a; transition: background 0.2s;
      &:hover { background: #eff6ff; border-color: #bfdbfe; }
      div { display: flex; flex-direction: column; }
      strong { font-size: 13px; }
      span { font-size: 11px; color: #64748b; }
    }
  `],
})
export class PortalDashboardComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private quoteService = inject(QuoteService);
  private contractService = inject(ContractService);
  private invoiceService = inject(InvoiceService);
  private clientPortalService = inject(ClientPortalService);

  loading = signal(true);

  pendingAppointments = signal(0);
  pendingQuotes = signal(0);
  unsignedContracts = signal(0);
  unpaidInvoices = signal(0);

  pendingQuotesList = signal<Quote[]>([]);
  unsignedContractsList = signal<Contract[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Résoudre d'abord le vrai clientId lié à l'utilisateur connecté
    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) {
        this.loading.set(false);
        return;
      }

      this.appointmentService.getByClient(clientId).subscribe(res => {
        this.pendingAppointments.set(res.filter(a => a.status === 'Pending' || a.status === 'Accepted').length);
      });

      this.quoteService.getAll(clientId).subscribe(res => {
        const pending = res.filter(q => q.status === 'Sent' || q.status === 'Draft');
        this.pendingQuotes.set(pending.length);
        this.pendingQuotesList.set(pending);
      });

      this.contractService.getAll(clientId).subscribe(res => {
        const unsigned = res.filter(c => c.status !== 'Signed' && !c.signedBy);
        this.unsignedContracts.set(unsigned.length);
        this.unsignedContractsList.set(unsigned);
      });

      this.invoiceService.getAll(clientId).subscribe(res => {
        this.unpaidInvoices.set(res.filter(i => i.paymentStatus !== 'PAID').length);
        this.loading.set(false);
      });
    });
  }
}

