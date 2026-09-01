import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { ClientService } from '../../../core/services/client.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { QuoteService } from '../../../core/services/quote.service';
import { ContractService } from '../../../core/services/contract.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { DocumentService } from '../../../core/services/document.service';

import { Appointment, AppointmentStatus, Client, Contact } from '../../../domain/models/client.model';
import { Quote, QuoteStatus } from '../../../domain/models/quote.model';
import { Contract, ContractStatus } from '../../../domain/models/contract.model';
import { Invoice, PaymentStatus } from '../../../domain/models/invoice.model';
import { DocumentModel } from '../../../domain/models/document.model';

import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

import { ClientFormDialogComponent } from '../client-form-dialog/client-form-dialog.component';
import { ContactFormDialogComponent } from '../contact-form-dialog/contact-form-dialog.component';
import { AppointmentFormDialogComponent } from '../appointment-form-dialog/appointment-form-dialog.component';
import { QuoteFormDialogComponent } from '../quote-form-dialog/quote-form-dialog.component';
import { ContractFormDialogComponent } from '../contract-form-dialog/contract-form-dialog.component';
import { InvoiceFormDialogComponent } from '../invoice-form-dialog/invoice-form-dialog.component';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DatePipe,
    DecimalPipe,
  ],
  template: `
    <div class="page-container">
      <!-- Top Navigation & Actions -->
      <div class="header-nav">
        <a routerLink="/clients" class="back-link">
          <mat-icon>arrow_back</mat-icon> Retour à la liste des clients
        </a>
      </div>

      @if (loading()) {
        <app-loading-overlay [loading]="true" />
      } @else if (client()) {
        <!-- Client Profile Header Card -->
        <div class="client-header-card">
          <div class="header-main">
            <div class="company-logo-avatar">
              {{ client()?.companyName?.charAt(0)?.toUpperCase() || 'C' }}
            </div>
            <div class="header-info">
              <div class="ref-tag">{{ client()?.reference || 'CLI-' + client()?.idClient }}</div>
              <h1>{{ client()?.companyName }}</h1>
              <div class="header-meta">
                <span><mat-icon inline>business</mat-icon> {{ client()?.sector || 'Secteur Non Défini' }}</span>
                <span><mat-icon inline>location_on</mat-icon> {{ client()?.city || 'N/A' }}, {{ client()?.country || 'N/A' }}</span>
                <span><mat-icon inline>source</mat-icon> Lead: {{ client()?.source || 'Direct' }}</span>
              </div>
            </div>
          </div>

          <div class="header-actions">
            <div class="score-box">
              <span class="score-val">⭐ {{ client()?.score || 0 }} pts</span>
              <span class="score-lbl">Score Prospect</span>
            </div>
            <button mat-stroked-button (click)="openEditClientDialog()">
              <mat-icon>edit</mat-icon> Modifier Fiche
            </button>
            <button mat-icon-button [matMenuTriggerFor]="mainMenu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #mainMenu="matMenu">
              <button mat-menu-item (click)="deleteClient()">
                <mat-icon color="warn">delete</mat-icon> Supprimer Client
              </button>
            </mat-menu>
          </div>
        </div>

        <!-- Workflow Stepper / Lifecycle Bar -->
        <div class="workflow-bar-card">
          <div class="workflow-title">Cycle de Vie Client & Opportunités</div>
          <div class="stepper-wrapper">
            <div class="step-item step-completed">
              <div class="step-icon"><mat-icon>check</mat-icon></div>
              <div class="step-label">1. Client Fiche</div>
            </div>

            <div class="step-line" [class.line-active]="appointments().length > 0"></div>

            <div class="step-item" [class.step-active]="appointments().length > 0">
              <div class="step-icon">
                @if (hasCompletedAppointment()) { <mat-icon>check</mat-icon> } @else { 2 }
              </div>
              <div class="step-label">2. Rendez-vous ({{ appointments().length }})</div>
            </div>

            <div class="step-line" [class.line-active]="quotes().length > 0"></div>

            <div class="step-item" [class.step-active]="quotes().length > 0">
              <div class="step-icon">
                @if (hasAcceptedQuote()) { <mat-icon>check</mat-icon> } @else { 3 }
              </div>
              <div class="step-label">3. Devis ({{ quotes().length }})</div>
            </div>

            <div class="step-line" [class.line-active]="contracts().length > 0"></div>

            <div class="step-item" [class.step-active]="contracts().length > 0">
              <div class="step-icon">
                @if (hasSignedContract()) { <mat-icon>check</mat-icon> } @else { 4 }
              </div>
              <div class="step-label">4. Contrat ({{ contracts().length }})</div>
            </div>

            <div class="step-line" [class.line-active]="invoices().length > 0"></div>

            <div class="step-item" [class.step-active]="invoices().length > 0">
              <div class="step-icon">
                @if (hasPaidInvoice()) { <mat-icon>check</mat-icon> } @else { 5 }
              </div>
              <div class="step-label">5. Facture & Paiement</div>
            </div>
          </div>
        </div>

        <!-- Main Detail Tabs -->
        <div class="detail-tabs-card">
          <mat-tab-group animationDuration="200ms">
            
            <!-- TAB 1: CONTACTS -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">contacts</mat-icon> Contacts ({{ contacts().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Interlocuteurs & Personnes de contact</h3>
                  <button mat-flat-button color="primary" (click)="openAddContactDialog()">
                    <mat-icon>person_add</mat-icon> Ajouter un Contact
                  </button>
                </div>

                @if (contacts().length === 0) {
                  <app-empty-state icon="person_off" title="Aucun contact enregistre" message="Ajoutez les interlocuteurs principaux de ce client." />
                } @else {
                  <div class="contacts-grid">
                    @for (c of contacts(); track c.idContact) {
                      <div class="contact-card" [class.contact-primary]="c.isPrimary">
                        @if (c.isPrimary) {
                          <div class="primary-badge"><mat-icon inline>star</mat-icon> Interlocuteur Principal</div>
                        }
                        <div class="contact-name">{{ c.firstName }} {{ c.lastName }}</div>
                        <div class="contact-position">{{ c.position || 'Poste non renseigné' }} @if (c.department) { ({{ c.department }}) }</div>

                        <div class="contact-details">
                          <div><mat-icon inline>email</mat-icon> <a [href]="'mailto:' + c.email">{{ c.email }}</a></div>
                          @if (c.mobile) { <div><mat-icon inline>smartphone</mat-icon> {{ c.mobile }}</div> }
                          @if (c.phone) { <div><mat-icon inline>phone</mat-icon> {{ c.phone }}</div> }
                        </div>

                        @if (c.notes) {
                          <div class="contact-notes">"{{ c.notes }}"</div>
                        }

                        <div class="contact-actions">
                          @if (!c.isPrimary) {
                            <button mat-button color="accent" class="btn-xs" (click)="setPrimaryContact(c)">
                              <mat-icon inline>star_border</mat-icon> Définir Principal
                            </button>
                          }
                          <button mat-icon-button (click)="openEditContactDialog(c)"><mat-icon>edit</mat-icon></button>
                          <button mat-icon-button color="warn" (click)="deleteContact(c)"><mat-icon>delete</mat-icon></button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- TAB 2: RENDEZ-VOUS (APPOINTMENTS) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">event</mat-icon> Rendez-vous ({{ appointments().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Historique des Rendez-vous & Réunions</h3>
                  <button mat-flat-button color="primary" (click)="openAddAppointmentDialog()">
                    <mat-icon>event</mat-icon> Planifier un Rendez-vous
                  </button>
                </div>

                @if (appointments().length === 0) {
                  <app-empty-state icon="event_busy" title="Aucun rendez-vous planifié" message="Planifiez une première réunion ou démo avec ce client." />
                } @else {
                  <table mat-table [dataSource]="appointments()" class="w-full">
                    <ng-container matColumnDef="subject">
                      <th mat-header-cell *matHeaderCellDef>Sujet</th>
                      <td mat-cell *matCellDef="let row">
                        <strong>{{ row.subject }}</strong>
                        @if (row.description) { <div class="sub-text">{{ row.description }}</div> }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date & Heure</th>
                      <td mat-cell *matCellDef="let row">{{ row.appointmentDate | date:'medium' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="location">
                      <th mat-header-cell *matHeaderCellDef>Lieu / Canal</th>
                      <td mat-cell *matCellDef="let row">{{ row.location || 'N/A' }}</td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-pill" [class]="'pill-' + row.status.toLowerCase()">
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Changer Statut</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-stroked-button [matMenuTriggerFor]="appMenu">
                          Changer <mat-icon>arrow_drop_down</mat-icon>
                        </button>
                        <mat-menu #appMenu="matMenu">
                          <button mat-menu-item (click)="updateAppointmentStatus(row, 'Pending')">En attente (Pending)</button>
                          <button mat-menu-item (click)="updateAppointmentStatus(row, 'Accepted')">Accepté (Accepted)</button>
                          <button mat-menu-item (click)="updateAppointmentStatus(row, 'Completed')">Terminé (Completed)</button>
                          <button mat-menu-item (click)="updateAppointmentStatus(row, 'Refused')">Refusé (Refused)</button>
                          <mat-divider></mat-divider>
                          <button mat-menu-item (click)="deleteAppointment(row)"><mat-icon color="warn">delete</mat-icon> Supprimer</button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['subject', 'date', 'location', 'status', 'actions']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['subject', 'date', 'location', 'status', 'actions']"></tr>
                  </table>
                }
              </div>
            </mat-tab>

            <!-- TAB 3: DEVIS (QUOTES) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">request_quote</mat-icon> Devis ({{ quotes().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Offres Commerciales & Devis</h3>
                  <button mat-flat-button color="primary" (click)="openAddQuoteDialog()">
                    <mat-icon>add</mat-icon> Nouveau Devis
                  </button>
                </div>

                @if (quotes().length === 0) {
                  <app-empty-state icon="request_quote" title="Aucun devis créé" message="Émettez un devis commercial pour ce client." />
                } @else {
                  <table mat-table [dataSource]="quotes()" class="w-full">
                    <ng-container matColumnDef="reference">
                      <th mat-header-cell *matHeaderCellDef>Référence</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="ref-badge">{{ row.reference || 'DEV-' + row.idQuote }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="title">
                      <th mat-header-cell *matHeaderCellDef>Intitulé</th>
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
                      <th mat-header-cell *matHeaderCellDef>Émis / Expiration</th>
                      <td mat-cell *matCellDef="let row">
                        {{ row.issueDate }} @if (row.expirationDate) { (exp: {{ row.expirationDate }}) }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-pill" [class]="'pill-' + row.status.toLowerCase()">
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button (click)="downloadQuotePdf(row)" matTooltip="Télécharger PDF">
                          <mat-icon color="primary">picture_as_pdf</mat-icon>
                        </button>
                        <button mat-stroked-button [matMenuTriggerFor]="quoteMenu">
                          Statut <mat-icon>arrow_drop_down</mat-icon>
                        </button>
                        <mat-menu #quoteMenu="matMenu">
                          <button mat-menu-item (click)="updateQuoteStatus(row, 'Sent')">Marquer Envoyé (Sent)</button>
                          <button mat-menu-item (click)="updateQuoteStatus(row, 'Accepted')">Marquer Accepté (Accepted)</button>
                          <button mat-menu-item (click)="updateQuoteStatus(row, 'Refused')">Marquer Refusé (Refused)</button>
                          <mat-divider></mat-divider>
                          @if (row.status === 'Accepted') {
                            <button mat-menu-item (click)="createContractFromQuote(row)">
                              <mat-icon color="accent">description</mat-icon> Transformer en Contrat
                            </button>
                          }
                          <button mat-menu-item (click)="deleteQuote(row)"><mat-icon color="warn">delete</mat-icon> Supprimer</button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['reference', 'title', 'amount', 'dates', 'status', 'actions']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['reference', 'title', 'amount', 'dates', 'status', 'actions']"></tr>
                  </table>
                }
              </div>
            </mat-tab>

            <!-- TAB 4: CONTRATS (CONTRACTS) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">description</mat-icon> Contrats ({{ contracts().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Contrats d'Engagements</h3>
                  <button mat-flat-button color="primary" (click)="openAddContractDialog()">
                    <mat-icon>add</mat-icon> Générer un Contrat
                  </button>
                </div>

                @if (contracts().length === 0) {
                  <app-empty-state icon="description" title="Aucun contrat engagé" message="Générez un contrat suite à un devis accepté." />
                } @else {
                  <table mat-table [dataSource]="contracts()" class="w-full">
                    <ng-container matColumnDef="reference">
                      <th mat-header-cell *matHeaderCellDef>Référence</th>
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
                      <th mat-header-cell *matHeaderCellDef>Montant</th>
                      <td mat-cell *matCellDef="let row">
                        <strong>{{ row.amount | number:'1.2-2' }} TND</strong>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="signature">
                      <th mat-header-cell *matHeaderCellDef>Signature</th>
                      <td mat-cell *matCellDef="let row">
                        @if (row.signedBy) {
                          <div class="signed-info">
                            <mat-icon inline color="primary">verified</mat-icon> Signé par {{ row.signedBy }}
                            <div class="sub-text">le {{ row.signedDate }}</div>
                          </div>
                        } @else {
                          <span class="pending-sig">Non signé</span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Statut</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-pill" [class]="'pill-' + row.status.toLowerCase()">
                          {{ row.status }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button (click)="downloadContractPdf(row)" matTooltip="Télécharger Contrat PDF">
                          <mat-icon color="primary">picture_as_pdf</mat-icon>
                        </button>

                        @if (row.status === 'Signed') {
                          <button mat-stroked-button color="primary" class="btn-xs" (click)="generateInvoiceFromContract(row)">
                            <mat-icon>receipt_long</mat-icon> Facturer
                          </button>
                        }

                        <button mat-icon-button [matMenuTriggerFor]="cntMenu"><mat-icon>more_vert</mat-icon></button>
                        <mat-menu #cntMenu="matMenu">
                          <button mat-menu-item (click)="deleteContract(row)"><mat-icon color="warn">delete</mat-icon> Supprimer</button>
                        </mat-menu>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['reference', 'title', 'amount', 'signature', 'status', 'actions']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['reference', 'title', 'amount', 'signature', 'status', 'actions']"></tr>
                  </table>
                }
              </div>
            </mat-tab>

            <!-- TAB 5: FACTURES (INVOICES) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">receipt_long</mat-icon> Factures ({{ invoices().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Facturation & Règlements</h3>
                  <button mat-flat-button color="primary" (click)="openAddInvoiceDialog()">
                    <mat-icon>add</mat-icon> Créer une Facture
                  </button>
                </div>

                @if (invoices().length === 0) {
                  <app-empty-state icon="receipt" title="Aucune facture émise" message="Générez des factures à partir des contrats signés." />
                } @else {
                  <table mat-table [dataSource]="invoices()" class="w-full">
                    <ng-container matColumnDef="reference">
                      <th mat-header-cell *matHeaderCellDef>N° Facture</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="ref-badge">{{ row.reference || 'FAC-' + row.idInvoice }}</span>
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

                    <ng-container matColumnDef="dates">
                      <th mat-header-cell *matHeaderCellDef>Émission / Échéance</th>
                      <td mat-cell *matCellDef="let row">
                        {{ row.issueDate }} @if (row.dueDate) { (Échéance: {{ row.dueDate }}) }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="paymentStatus">
                      <th mat-header-cell *matHeaderCellDef>Paiement</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="status-pill" [class]="'pill-' + row.paymentStatus.toLowerCase()">
                          {{ row.paymentStatus }}
                        </span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef>Actions</th>
                      <td mat-cell *matCellDef="let row">
                        <button mat-icon-button (click)="downloadInvoicePdf(row)" matTooltip="Télécharger Facture PDF">
                          <mat-icon color="primary">picture_as_pdf</mat-icon>
                        </button>

                        @if (row.paymentStatus !== 'PAID') {
                          <button mat-stroked-button color="primary" class="btn-xs" (click)="togglePaymentStatus(row, 'PAID')">
                            <mat-icon inline>check_circle</mat-icon> Marquer Payée
                          </button>
                        } @else {
                          <button mat-button color="accent" class="btn-xs" (click)="togglePaymentStatus(row, 'UNPAID')">
                            Annuler Paiement
                          </button>
                        }

                        <button mat-icon-button (click)="deleteInvoice(row)"><mat-icon color="warn">delete</mat-icon></button>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['reference', 'amount', 'total', 'dates', 'paymentStatus', 'actions']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['reference', 'amount', 'total', 'dates', 'paymentStatus', 'actions']"></tr>
                  </table>
                }
              </div>
            </mat-tab>

            <!-- TAB 6: DOCUMENTS -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">folder_zip</mat-icon> Espace Documentaire ({{ documents().length }})
              </ng-template>
              <div class="tab-pane">
                <div class="pane-header">
                  <h3>Fichiers & Documents Rattachés au Dossier Client</h3>
                  <label mat-flat-button color="primary" class="upload-btn">
                    <mat-icon>file_upload</mat-icon> Téléverser un Document
                    <input type="file" (change)="onFileSelected($event)" hidden />
                  </label>
                </div>

                @if (documents().length === 0) {
                  <app-empty-state icon="cloud_upload" title="Aucun document rattaché" message="Téléversez des fichiers (Contrats signés, CDC, PDF) dans ce dossier client." />
                } @else {
                  <div class="documents-grid">
                    @for (doc of documents(); track doc.idDocument) {
                      <div class="doc-card">
                        <div class="doc-icon">
                          <mat-icon>description</mat-icon>
                        </div>
                        <div class="doc-info">
                          <div class="doc-title">{{ doc.title || doc.fileName }}</div>
                          <div class="doc-sub">{{ doc.fileName }} ({{ doc.category || 'Général' }})</div>
                          <div class="doc-date">Dépôt: {{ doc.uploadedAt | date:'mediumDate' }}</div>
                        </div>
                        <div class="doc-actions">
                          <button mat-icon-button color="primary" (click)="downloadDoc(doc)" matTooltip="Télécharger">
                            <mat-icon>download</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" (click)="deleteDoc(doc)" matTooltip="Supprimer">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

          </mat-tab-group>
        </div>
      }
    </div>
  `,
  styles: [`
    .header-nav { margin-bottom: 16px; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--color-primary); text-decoration: none; font-weight: 500; font-size: 14px;
    }

    .client-header-card {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: 20px;
    }

    .header-main { display: flex; align-items: center; gap: 20px; }
    .company-logo-avatar {
      width: 64px; height: 64px; border-radius: 16px;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: white; font-weight: 800; font-size: 28px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .ref-tag {
      display: inline-block; font-family: monospace; font-size: 12px;
      background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;
    }
    .header-info h1 { margin: 4px 0; font-size: 24px; color: var(--color-text-primary); }
    .header-meta {
      display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--color-text-secondary);
      span { display: flex; align-items: center; gap: 4px; }
    }

    .header-actions { display: flex; align-items: center; gap: 16px; }
    .score-box {
      display: flex; flex-direction: column; align-items: flex-end;
      background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 14px; border-radius: 8px;
    }
    .score-val { font-size: 16px; font-weight: 700; color: #15803d; }
    .score-lbl { font-size: 11px; color: #166534; }

    /* Workflow Stepper */
    .workflow-bar-card {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 16px 24px;
      border: 1px solid var(--color-border);
      margin-bottom: 20px;
    }
    .workflow-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 12px; letter-spacing: 0.5px; }
    .stepper-wrapper { display: flex; align-items: center; justify-content: space-between; overflow-x: auto; padding: 8px 0; }
    .step-item { display: flex; align-items: center; gap: 8px; opacity: 0.5; transition: all 0.3s; }
    .step-item.step-active, .step-item.step-completed { opacity: 1; }
    .step-icon {
      width: 28px; height: 28px; border-radius: 50%; background: #e2e8f0; color: #475569;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;
    }
    .step-completed .step-icon { background: #22c55e; color: white; }
    .step-active .step-icon { background: #3b82f6; color: white; }
    .step-label { font-size: 13px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; }
    .step-line { flex: 1; height: 3px; background: #e2e8f0; margin: 0 12px; min-width: 20px; }
    .line-active { background: #3b82f6; }

    /* Tabs Card */
    .detail-tabs-card {
      background: var(--color-surface);
      border-radius: 12px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }
    .tab-icon { margin-right: 8px; }
    .tab-pane { padding: 24px; }
    .pane-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; h3 { margin: 0; font-size: 18px; } }

    /* Contacts Grid */
    .contacts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .contact-card {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; position: relative;
    }
    .contact-primary { border-color: #3b82f6; background: #eff6ff; }
    .primary-badge { font-size: 11px; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; }
    .contact-name { font-size: 16px; font-weight: 700; color: var(--color-text-primary); }
    .contact-position { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 10px; }
    .contact-details { font-size: 12px; display: flex; flex-direction: column; gap: 4px; color: #334155; a { color: #2563eb; text-decoration: none; } }
    .contact-notes { font-size: 11px; font-style: italic; background: white; padding: 6px 10px; border-radius: 6px; margin-top: 8px; border: 1px solid #cbd5e1; }
    .contact-actions { display: flex; justify-content: flex-end; gap: 4px; margin-top: 12px; }

    /* Pills & Badges */
    .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
    .pill-pending { background: #fef3c7; color: #d97706; }
    .pill-accepted, .pill-completed, .pill-signed, .pill-paid { background: #dcfce7; color: #15803d; }
    .pill-refused, .pill-cancelled, .pill-unpaid, .pill-overdue { background: #fee2e2; color: #b91c1c; }
    .pill-draft, .pill-sent { background: #e0f2fe; color: #0369a1; }

    .sub-text { font-size: 11px; color: var(--color-text-secondary); }
    .signed-info { font-size: 12px; color: #166534; font-weight: 600; }
    .pending-sig { font-size: 12px; color: #94a3b8; font-style: italic; }
    .btn-xs { font-size: 12px; line-height: 28px; padding: 0 10px; }

    /* Documents Grid */
    .documents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .doc-card {
      display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0;
      padding: 12px 16px; border-radius: 10px;
    }
    .doc-icon { width: 40px; height: 40px; border-radius: 8px; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; }
    .doc-info { flex: 1; overflow: hidden; }
    .doc-title { font-weight: 600; font-size: 13px; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .doc-sub { font-size: 11px; color: var(--color-text-secondary); }
    .doc-date { font-size: 10px; color: #94a3b8; }
    .upload-btn { cursor: pointer; }
  `],
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientService = inject(ClientService);
  private appointmentService = inject(AppointmentService);
  private quoteService = inject(QuoteService);
  private contractService = inject(ContractService);
  private invoiceService = inject(InvoiceService);
  private documentService = inject(DocumentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  clientId!: number;
  loading = signal(true);

  client = signal<Client | null>(null);
  contacts = signal<Contact[]>([]);
  appointments = signal<Appointment[]>([]);
  quotes = signal<Quote[]>([]);
  contracts = signal<Contract[]>([]);
  invoices = signal<Invoice[]>([]);
  documents = signal<DocumentModel[]>([]);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.clientId = Number(idParam);
      this.loadAll();
    }
  }

  loadAll(): void {
    this.loading.set(true);
    this.clientService.getById(this.clientId).subscribe({
      next: c => {
        this.client.set(c);
        this.contacts.set(c.contacts || []);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Client non trouvé', 'Fermer', { duration: 3000 });
        this.router.navigate(['/clients']);
      },
    });

    this.loadAppointments();
    this.loadQuotes();
    this.loadContracts();
    this.loadInvoices();
    this.loadDocuments();
  }

  loadAppointments(): void {
    this.appointmentService.getByClient(this.clientId).subscribe(res => this.appointments.set(res));
  }

  loadQuotes(): void {
    this.quoteService.getAll(this.clientId).subscribe(res => this.quotes.set(res));
  }

  loadContracts(): void {
    this.contractService.getAll(this.clientId).subscribe(res => this.contracts.set(res));
  }

  loadInvoices(): void {
    this.invoiceService.getAll(this.clientId).subscribe(res => this.invoices.set(res));
  }

  loadDocuments(): void {
    this.documentService.getDocuments(this.clientId).subscribe(res => this.documents.set(res));
  }

  // --- WORKFLOW COMPUTED FLAGS ---
  hasCompletedAppointment(): boolean {
    return this.appointments().some(a => a.status === 'Completed' || a.status === 'Accepted');
  }

  hasAcceptedQuote(): boolean {
    return this.quotes().some(q => q.status === 'Accepted');
  }

  hasSignedContract(): boolean {
    return this.contracts().some(c => c.status === 'Signed' || !!c.signedBy);
  }

  hasPaidInvoice(): boolean {
    return this.invoices().some(i => i.paymentStatus === 'PAID');
  }

  // --- CLIENT ACTIONS ---
  openEditClientDialog(): void {
    const current = this.client();
    if (!current) return;

    this.dialog
      .open(ClientFormDialogComponent, { width: '600px', data: { client: current } })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.clientService.update(this.clientId, form))
      )
      .subscribe({
        next: updated => {
          this.client.set(updated);
          this.snackBar.open('Fiche client mise à jour', 'OK', { duration: 3000 });
        },
      });
  }

  deleteClient(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer Client',
          message: `Supprimer définitivement ${this.client()?.companyName} ?`,
          confirmLabel: 'Supprimer',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.clientService.delete(this.clientId))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Client supprimé', 'OK', { duration: 3000 });
          this.router.navigate(['/clients']);
        },
      });
  }

  // --- CONTACTS ACTIONS ---
  openAddContactDialog(): void {
    this.dialog
      .open(ContactFormDialogComponent, { width: '520px', data: {} })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.clientService.addContact(this.clientId, form))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contact ajouté', 'OK', { duration: 3000 });
          this.loadAll();
        },
      });
  }

  openEditContactDialog(contact: Contact): void {
    this.dialog
      .open(ContactFormDialogComponent, { width: '520px', data: { contact } })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.clientService.updateContact(this.clientId, contact.idContact!, form))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contact mis à jour', 'OK', { duration: 3000 });
          this.loadAll();
        },
      });
  }

  setPrimaryContact(contact: Contact): void {
    if (!contact.idContact) return;
    this.clientService.setPrimaryContact(this.clientId, contact.idContact).subscribe({
      next: () => {
        this.snackBar.open(`${contact.firstName} défini comme contact principal`, 'OK', { duration: 3000 });
        this.loadAll();
      },
    });
  }

  deleteContact(contact: Contact): void {
    if (!contact.idContact) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Supprimer Contact', message: `Supprimer ${contact.firstName} ${contact.lastName} ?`, danger: true },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.clientService.deleteContact(this.clientId, contact.idContact!))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contact supprimé', 'OK', { duration: 3000 });
          this.loadAll();
        },
      });
  }

  // --- APPOINTMENTS ACTIONS ---
  openAddAppointmentDialog(): void {
    this.dialog
      .open(AppointmentFormDialogComponent, { width: '520px', data: {} })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.appointmentService.create(this.clientId, form))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Rendez-vous planifié', 'OK', { duration: 3000 });
          this.loadAppointments();
        },
      });
  }

  updateAppointmentStatus(app: Appointment, status: AppointmentStatus): void {
    if (!app.idAppointment) return;
    this.appointmentService.updateStatus(this.clientId, app.idAppointment, status).subscribe({
      next: () => {
        this.snackBar.open(`Statut changé à ${status}`, 'OK', { duration: 3000 });
        this.loadAppointments();
      },
    });
  }

  deleteAppointment(app: Appointment): void {
    if (!app.idAppointment) return;
    this.appointmentService.delete(this.clientId, app.idAppointment).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous supprimé', 'OK', { duration: 3000 });
        this.loadAppointments();
      },
    });
  }

  // --- QUOTES ACTIONS ---
  openAddQuoteDialog(): void {
    this.dialog
      .open(QuoteFormDialogComponent, { width: '540px', data: {} })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.quoteService.create({ ...form, clientId: this.clientId }))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Devis créé avec succès', 'OK', { duration: 3000 });
          this.loadQuotes();
        },
      });
  }

  updateQuoteStatus(quote: Quote, status: QuoteStatus): void {
    if (!quote.idQuote) return;
    this.quoteService.updateStatus(quote.idQuote, status).subscribe({
      next: () => {
        this.snackBar.open(`Devis marqué comme ${status}`, 'OK', { duration: 3000 });
        this.loadQuotes();
      },
    });
  }

  downloadQuotePdf(quote: Quote): void {
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

  deleteQuote(quote: Quote): void {
    if (!quote.idQuote) return;
    this.quoteService.delete(quote.idQuote).subscribe({
      next: () => {
        this.snackBar.open('Devis supprimé', 'OK', { duration: 3000 });
        this.loadQuotes();
      },
    });
  }

  createContractFromQuote(quote: Quote): void {
    this.dialog
      .open(ContractFormDialogComponent, {
        width: '560px',
        data: {
          quoteId: quote.idQuote,
          amount: quote.total || quote.amount,
          contract: { title: `Contrat - ${quote.title}` } as any,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.contractService.create({ ...form, clientId: this.clientId }))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contrat généré depuis le devis !', 'OK', { duration: 3000 });
          this.loadContracts();
        },
      });
  }

  // --- CONTRACTS ACTIONS ---
  openAddContractDialog(): void {
    this.dialog
      .open(ContractFormDialogComponent, { width: '560px', data: {} })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.contractService.create({ ...form, clientId: this.clientId }))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Contrat créé avec succès', 'OK', { duration: 3000 });
          this.loadContracts();
        },
      });
  }

  downloadContractPdf(contract: Contract): void {
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

  deleteContract(contract: Contract): void {
    if (!contract.idContract) return;
    this.contractService.delete(contract.idContract).subscribe({
      next: () => {
        this.snackBar.open('Contrat supprimé', 'OK', { duration: 3000 });
        this.loadContracts();
      },
    });
  }

  generateInvoiceFromContract(contract: Contract): void {
    if (!contract.idContract) return;
    this.invoiceService.createFromContract(contract.idContract).subscribe({
      next: () => {
        this.snackBar.open('Facture générée automatiquement depuis le contrat signé !', 'OK', { duration: 4000 });
        this.loadInvoices();
      },
      error: () => this.snackBar.open('Erreur lors de la génération de facture', 'Fermer', { duration: 4000 }),
    });
  }

  // --- INVOICES ACTIONS ---
  openAddInvoiceDialog(): void {
    this.dialog
      .open(InvoiceFormDialogComponent, { width: '540px', data: {} })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => this.invoiceService.create({ ...form, clientId: this.clientId }))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Facture émise avec succès', 'OK', { duration: 3000 });
          this.loadInvoices();
        },
      });
  }

  togglePaymentStatus(invoice: Invoice, status: PaymentStatus): void {
    if (!invoice.idInvoice) return;
    this.invoiceService.updatePaymentStatus(invoice.idInvoice, status).subscribe({
      next: () => {
        this.snackBar.open(`Statut de paiement mis à jour: ${status}`, 'OK', { duration: 3000 });
        this.loadInvoices();
      },
    });
  }

  downloadInvoicePdf(invoice: Invoice): void {
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

  deleteInvoice(invoice: Invoice): void {
    if (!invoice.idInvoice) return;
    this.invoiceService.delete(invoice.idInvoice).subscribe({
      next: () => {
        this.snackBar.open('Facture supprimée', 'OK', { duration: 3000 });
        this.loadInvoices();
      },
    });
  }

  // --- DOCUMENTS ACTIONS ---
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.documentService
        .uploadDocument(file, this.clientId, undefined, file.name, 'Général', 'Document rattaché au client')
        .subscribe({
          next: () => {
            this.snackBar.open('Document téléversé avec succès !', 'OK', { duration: 3000 });
            this.loadDocuments();
          },
          error: () => this.snackBar.open('Erreur lors du téléversement', 'Fermer', { duration: 4000 }),
        });
    }
  }

  downloadDoc(doc: DocumentModel): void {
    if (!doc.idDocument) return;
    this.documentService.downloadDocument(doc.idDocument).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || doc.title || 'document.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  deleteDoc(doc: DocumentModel): void {
    if (!doc.idDocument) return;
    this.documentService.delete(doc.idDocument).subscribe({
      next: () => {
        this.snackBar.open('Document supprimé', 'OK', { duration: 3000 });
        this.loadDocuments();
      },
    });
  }
}
