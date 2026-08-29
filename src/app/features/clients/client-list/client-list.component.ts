import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../domain/models/client.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { ClientFormDialogComponent } from '../client-form-dialog/client-form-dialog.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatChipsModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Gestion des Clients</h1>
          <p class="subtitle">Portefeuille clients, contacts rattachés et opportunités d'affaires</p>
        </div>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Nouveau Client
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <mat-icon>business</mat-icon>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ totalClients() }}</span>
            <span class="stat-card__label">Total Clients</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <mat-icon>trending_up</mat-icon>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ highScoreClients() }}</span>
            <span class="stat-card__label">Prospects Chauds (Score > 70)</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--purple">
            <mat-icon>category</mat-icon>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ sectorsCount() }}</span>
            <span class="stat-card__label">Secteurs Activité</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <mat-icon>contacts</mat-icon>
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ totalContacts() }}</span>
            <span class="stat-card__label">Contacts Enregistrés</span>
          </div>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="section-card" style="position: relative">
        <!-- Search & Filter Form -->
        <form class="search-bar" [formGroup]="filterForm">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="flex-2">
            <mat-label>Rechercher (Nom, Réf, Email...)</mat-label>
            <input matInput formControlName="query" placeholder="Recherche multi-critères..." />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Secteur</mat-label>
            <mat-select formControlName="sector">
              <mat-option value="">Tous les secteurs</mat-option>
              <mat-option value="Informatique & IT">Informatique & IT</mat-option>
              <mat-option value="Finance & Banque">Finance & Banque</mat-option>
              <mat-option value="Industrie & BTP">Industrie & BTP</mat-option>
              <mat-option value="Santé & Pharma">Santé & Pharma</mat-option>
              <mat-option value="Commerce & Distribution">Commerce & Distribution</mat-option>
              <mat-option value="Services & Conseil">Services & Conseil</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Ville</mat-label>
            <input matInput formControlName="city" placeholder="Filtrer par ville..." />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Pays</mat-label>
            <input matInput formControlName="country" placeholder="Filtrer par pays..." />
          </mat-form-field>
        </form>

        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state
            icon="domain_disabled"
            title="Aucun client trouvé"
            message="Créez un nouveau client ou modifiez vos filtres de recherche."
          />
        } @else {
          <div class="table-responsive">
            <table mat-table [dataSource]="dataSource" class="w-full">
              <!-- Reference Column -->
              <ng-container matColumnDef="reference">
                <th mat-header-cell *matHeaderCellDef>Référence</th>
                <td mat-cell *matCellDef="let row">
                  <span class="ref-badge">{{ row.reference || 'CLI-' + row.idClient }}</span>
                </td>
              </ng-container>

              <!-- Company Name Column -->
              <ng-container matColumnDef="companyName">
                <th mat-header-cell *matHeaderCellDef>Entreprise</th>
                <td mat-cell *matCellDef="let row">
                  <div class="company-cell">
                    <div class="company-avatar">
                      {{ row.companyName ? row.companyName.charAt(0).toUpperCase() : 'C' }}
                    </div>
                    <div>
                      <a [routerLink]="['/clients', row.idClient]" class="company-link">
                        {{ row.companyName }}
                      </a>
                      <div class="company-sub">{{ row.source || 'Direct' }}</div>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Sector Column -->
              <ng-container matColumnDef="sector">
                <th mat-header-cell *matHeaderCellDef>Secteur</th>
                <td mat-cell *matCellDef="let row">
                  <span class="sector-chip">{{ row.sector || 'N/A' }}</span>
                </td>
              </ng-container>

              <!-- Contact Info Column -->
              <ng-container matColumnDef="contact">
                <th mat-header-cell *matHeaderCellDef>Contact Principal</th>
                <td mat-cell *matCellDef="let row">
                  <div class="contact-info">
                    <span class="email"><mat-icon inline>email</mat-icon> {{ row.email }}</span>
                    @if (row.phone) {
                      <span class="phone"><mat-icon inline>phone</mat-icon> {{ row.phone }}</span>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Location Column -->
              <ng-container matColumnDef="location">
                <th mat-header-cell *matHeaderCellDef>Localisation</th>
                <td mat-cell *matCellDef="let row">
                  <span>{{ row.city || '-' }}{{ row.country ? ', ' + row.country : '' }}</span>
                </td>
              </ng-container>

              <!-- Score Lead Column -->
              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef>Score Lead</th>
                <td mat-cell *matCellDef="let row">
                  <span
                    class="score-badge"
                    [class.score-high]="(row.score || 0) >= 70"
                    [class.score-medium]="(row.score || 0) >= 40 && (row.score || 0) < 70"
                    [class.score-low]="(row.score || 0) < 40"
                  >
                    ⭐ {{ row.score || 0 }} pts
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/clients', row.idClient]">
                      <mat-icon color="primary">visibility</mat-icon> Voir la fiche
                    </button>
                    <button mat-menu-item (click)="openDialog(row)">
                      <mat-icon>edit</mat-icon> Modifier
                    </button>
                    <button mat-menu-item (click)="delete(row)">
                      <mat-icon color="warn">delete</mat-icon> Supprimer
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-secondary); font-size: 13px; margin: 4px 0 0; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--color-surface);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .stat-card__icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      mat-icon { font-size: 24px; width: 24px; height: 24px; }
      &--blue { background: linear-gradient(135deg, #2563eb, #1d4ed8); }
      &--green { background: linear-gradient(135deg, #059669, #047857); }
      &--purple { background: linear-gradient(135deg, #7c3aed, #6d28d9); }
      &--orange { background: linear-gradient(135deg, #ea580c, #c2410c); }
    }

    .stat-card__info {
      display: flex;
      flex-direction: column;
    }

    .stat-card__value {
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .stat-card__label {
      font-size: 12px;
      color: var(--color-text-secondary);
    }

    .search-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .flex-2 { flex: 2; min-width: 250px; }

    .company-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .company-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #e0e7ff;
      color: #3730a3;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .company-link {
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;

      &:hover { text-decoration: underline; }
    }

    .company-sub {
      font-size: 11px;
      color: var(--color-text-secondary);
    }

    .ref-badge {
      font-family: monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 6px;
      color: #334155;
      font-weight: 600;
    }

    .sector-chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      background: #f0fdf4;
      color: #166534;
      font-weight: 500;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      font-size: 12px;
      gap: 2px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--color-text-secondary);
      }
    }

    .score-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .score-high { background: #dcfce7; color: #15803d; }
    .score-medium { background: #fef9c3; color: #a16207; }
    .score-low { background: #fee2e2; color: #b91c1c; }

    .table-responsive {
      overflow-x: auto;
    }
  `],
})
export class ClientListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private service = inject(ClientService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  loading = signal(true);
  dataSource = new MatTableDataSource<Client>([]);
  columns = ['reference', 'companyName', 'sector', 'contact', 'location', 'score', 'actions'];

  totalClients = signal(0);
  highScoreClients = signal(0);
  sectorsCount = signal(0);
  totalContacts = signal(0);

  filterForm = this.fb.nonNullable.group({
    query: [''],
    sector: [''],
    city: [''],
    country: [''],
  });

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load());
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  load(): void {
    this.loading.set(true);
    const f = this.filterForm.getRawValue();
    this.service
      .getAll({
        query: f.query || undefined,
        sector: f.sector || undefined,
        city: f.city || undefined,
        country: f.country || undefined,
      })
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.totalClients.set(data.length);

        const high = data.filter(c => (c.score || 0) >= 70).length;
        this.highScoreClients.set(high);

        const sectors = new Set(data.map(c => c.sector).filter(Boolean));
        this.sectorsCount.set(sectors.size);

        const contactsCount = data.reduce((acc, c) => acc + (c.contacts?.length || 0), 0);
        this.totalContacts.set(contactsCount);

        this.loading.set(false);
      });
  }

  openDialog(client?: Client): void {
    this.dialog
      .open(ClientFormDialogComponent, {
        width: '600px',
        data: { client },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          client && client.idClient
            ? this.service.update(client.idClient, form)
            : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(client ? 'Client mis à jour' : 'Client créé avec succès', 'OK', {
            duration: 3000,
          });
          this.load();
        },
        error: () => this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 }),
      });
  }

  delete(client: Client): void {
    if (!client.idClient) return;

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer le Client',
          message: `Voulez-vous vraiment supprimer "${client.companyName}" ainsi que tous ses contacts ?`,
          confirmLabel: 'Supprimer',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(client.idClient!))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Client supprimé avec succès', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 4000 }),
      });
  }
}
