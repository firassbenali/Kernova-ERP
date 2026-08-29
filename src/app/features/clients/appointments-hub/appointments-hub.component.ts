import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';

import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../domain/models/client.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-appointments-hub',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DatePipe,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Tableau de Bord des Rendez-vous</h1>
          <p class="subtitle">Vue d'ensemble de l'ensemble des rendez-vous et réunions de l'entreprise</p>
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="filters-bar">
        <button
          mat-stroked-button
          [class.active-filter]="selectedFilter() === 'ALL'"
          (click)="filterBy('ALL')"
        >
          Tous les rendez-vous ({{ allAppointments().length }})
        </button>

        <button
          mat-stroked-button
          [class.active-filter]="selectedFilter() === 'Pending'"
          (click)="filterBy('Pending')"
        >
          En attente ({{ countByStatus('Pending') }})
        </button>

        <button
          mat-stroked-button
          [class.active-filter]="selectedFilter() === 'Accepted'"
          (click)="filterBy('Accepted')"
        >
          Acceptés ({{ countByStatus('Accepted') }})
        </button>

        <button
          mat-stroked-button
          [class.active-filter]="selectedFilter() === 'Completed'"
          (click)="filterBy('Completed')"
        >
          Terminés ({{ countByStatus('Completed') }})
        </button>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && filteredAppointments().length === 0) {
          <app-empty-state icon="event_busy" title="Aucun rendez-vous" message="Aucun rendez-vous ne correspond au filtre sélectionné." />
        } @else {
          <table mat-table [dataSource]="filteredAppointments()" class="w-full">
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Client</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/clients', row.clientId]" class="client-link">
                  <mat-icon inline>business</mat-icon> Client #{{ row.clientId }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Sujet / Motif</th>
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
                <button mat-stroked-button [matMenuTriggerFor]="statusMenu">
                  Action <mat-icon>arrow_drop_down</mat-icon>
                </button>
                <mat-menu #statusMenu="matMenu">
                  <button mat-menu-item (click)="updateStatus(row, 'Pending')">En attente</button>
                  <button mat-menu-item (click)="updateStatus(row, 'Accepted')">Accepter</button>
                  <button mat-menu-item (click)="updateStatus(row, 'Completed')">Terminer</button>
                  <button mat-menu-item (click)="updateStatus(row, 'Refused')">Refuser</button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item [routerLink]="['/clients', row.clientId]">
                    <mat-icon color="primary">visibility</mat-icon> Voir Client
                  </button>
                </mat-menu>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['client', 'subject', 'date', 'location', 'status', 'actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['client', 'subject', 'date', 'location', 'status', 'actions']"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .subtitle { color: var(--color-text-secondary); font-size: 13px; margin: 4px 0 0; }
    
    .filters-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      button {
        border-radius: 20px;
        font-size: 13px;
        &.active-filter {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      }
    }

    .client-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
    .pill-pending { background: #fef3c7; color: #d97706; }
    .pill-accepted, .pill-completed { background: #dcfce7; color: #15803d; }
    .pill-refused { background: #fee2e2; color: #b91c1c; }

    .sub-text { font-size: 11px; color: var(--color-text-secondary); }
  `],
})
export class AppointmentsHubComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  allAppointments = signal<Appointment[]>([]);
  selectedFilter = signal<string>('ALL');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.appointmentService.getAllAppointments().subscribe({
      next: res => {
        this.allAppointments.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterBy(status: string): void {
    this.selectedFilter.set(status);
  }

  filteredAppointments(): Appointment[] {
    const f = this.selectedFilter();
    if (f === 'ALL') return this.allAppointments();
    return this.allAppointments().filter(a => a.status === f);
  }

  countByStatus(status: string): number {
    return this.allAppointments().filter(a => a.status === status).length;
  }

  updateStatus(app: Appointment, status: AppointmentStatus): void {
    if (!app.idAppointment) return;
    this.appointmentService.updateStatus(app.clientId, app.idAppointment, status).subscribe({
      next: () => {
        this.snackBar.open(`Statut changé à ${status}`, 'OK', { duration: 3000 });
        this.load();
      },
    });
  }
}
