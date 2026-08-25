import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TeamService } from '../../../../core/services/team.service';
import { Team } from '../../../../domain/models/team.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { TeamFormDialogComponent, TeamDialogData } from '../team-form-dialog/team-form-dialog.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSortModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Teams</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Team
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="group" title="No teams" message="Create teams and assign leaders." />
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Team</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/rh/teams', row.id]" class="link">{{ row.name }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="leaderName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Leader</th>
              <td mat-cell *matCellDef="let row">{{ row.leaderName }}</td>
            </ng-container>
            <ng-container matColumnDef="memberCount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Members</th>
              <td mat-cell *matCellDef="let row">{{ row.memberCount ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/rh/teams', row.id]">
                    <mat-icon>visibility</mat-icon> View
                  </button>
                  <button mat-menu-item (click)="openDialog(row)">
                    <mat-icon>edit</mat-icon> Edit
                  </button>
                  <button mat-menu-item (click)="delete(row)">
                    <mat-icon color="warn">delete</mat-icon> Delete
                  </button>
                </mat-menu>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }
  `],
})
export class TeamListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  private service = inject(TeamService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<Team>([]);
  columns = ['name', 'leaderName', 'memberCount', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  load(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        this.dataSource.data = data;
        this.loading.set(false);
      });
  }

  openDialog(team?: Team): void {
    this.dialog
      .open(TeamFormDialogComponent, {
        width: '420px',
        data: { team } satisfies TeamDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form => (team ? this.service.update(team.id, form) : this.service.create(form)))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(team ? 'Team updated' : 'Team created', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(team: Team): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Team',
          message: `Delete "${team.name}"?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(team.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Team deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
