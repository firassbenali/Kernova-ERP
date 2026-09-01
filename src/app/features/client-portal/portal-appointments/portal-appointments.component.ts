import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Appointment } from '../../../domain/models/client.model';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppointmentFormDialogComponent } from '../../clients/appointment-form-dialog/appointment-form-dialog.component';
import { ClientPortalService } from '../../../core/services/client-portal.service';
import { filter, switchMap } from 'rxjs';

@Component({
  selector: 'app-portal-appointments',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
    DatePipe,
  ],
  template: `
    <div class="portal-section">
      <div class="section-header">
        <div>
          <h2>Mes Rendez-vous & Réunions</h2>
          <p class="subtitle">Consultez l'historique de vos rendez-vous ou demandez un nouveau créneau</p>
        </div>
        <button mat-flat-button color="primary" (click)="requestAppointment()">
          <mat-icon>event</mat-icon> Demander un Rendez-vous
        </button>
      </div>

      <div class="portal-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && appointments().length === 0) {
          <app-empty-state
            icon="event_busy"
            title="Aucun rendez-vous planifié"
            message="Demandez un rendez-vous avec notre équipe pour discuter de vos projets."
          />
        } @else {
          <table mat-table [dataSource]="appointments()" class="w-full">
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
              <td mat-cell *matCellDef="let row">{{ row.location || 'Visioconférence' }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Statut</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-pill" [class]="'pill-' + row.status.toLowerCase()">
                  {{ row.status === 'Pending' ? 'En attente de confirmation' : row.status }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['subject', 'date', 'location', 'status']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['subject', 'date', 'location', 'status']"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; h2 { margin: 0; font-size: 22px; color: #0f172a; } }
    .subtitle { color: #64748b; font-size: 13px; margin: 4px 0 0; }

    .portal-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .w-full { width: 100%; }
    .sub-text { font-size: 11px; color: #64748b; }

    .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
    .pill-pending { background: #fef3c7; color: #d97706; }
    .pill-accepted, .pill-completed { background: #dcfce7; color: #15803d; }
    .pill-refused { background: #fee2e2; color: #b91c1c; }
  `],
})
export class PortalAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private clientPortalService = inject(ClientPortalService);

  loading = signal(true);
  appointments = signal<Appointment[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) {
        this.appointments.set([]);
        this.loading.set(false);
        return;
      }

      this.appointmentService.getByClient(clientId).subscribe({
        next: res => {
          const filtered = (res || []).filter(a => a.clientId === clientId);
          this.appointments.set(filtered);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  requestAppointment(): void {
    this.clientPortalService.resolveClientId().subscribe(clientId => {
      if (!clientId) return;

      this.dialog
        .open(AppointmentFormDialogComponent, { width: '520px', data: {} })
        .afterClosed()
        .pipe(
          filter(Boolean),
          switchMap(form => {
            const payload = { ...form, clientId, status: 'Pending' as const };
            return this.appointmentService.create(clientId, payload);
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Votre demande de rendez-vous a été transmise avec succès !', 'OK', { duration: 4000 });
            this.load();
          },
        });
    });
  }
}

