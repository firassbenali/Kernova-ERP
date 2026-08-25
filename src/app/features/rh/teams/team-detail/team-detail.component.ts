import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TeamService } from '../../../../core/services/team.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Team } from '../../../../domain/models/team.model';
import { Employee } from '../../../../domain/models/employee.model';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    LoadingOverlayComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <a mat-icon-button routerLink="/rh/teams"><mat-icon>arrow_back</mat-icon></a>
          <h1>{{ team()?.name ?? 'Team' }}</h1>
        </div>
      </div>

      <app-loading-overlay [loading]="loading()"></app-loading-overlay>

      @if (team(); as t) {
        <mat-card class="detail-card">
          <div class="detail-grid">
            <div><span class="label">Team Name</span><span>{{ t.name }}</span></div>
            <div><span class="label">Leader</span><span>{{ t.leaderName || '—' }}</span></div>
            <div><span class="label">Members</span><span>{{ t.memberCount ?? 0 }}</span></div>
          </div>
        </mat-card>

        <mat-card class="members-card">
          <div class="members-header">
            <h2>Team Members</h2>
            <button mat-flat-button color="primary" (click)="openAddMember()">
              <mat-icon>person_add</mat-icon> Add Member
            </button>
          </div>

          @if (members().length === 0) {
            <app-empty-state
              icon="group"
              title="No members yet"
              message="Add employees to this team." />
          } @else {
            <table mat-table [dataSource]="dataSource" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.username }}</td>
              </ng-container>
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let row">{{ row.userEmail }}</td>
              </ng-container>
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Position</th>
                <td mat-cell *matCellDef="let row">{{ row.positionTitle || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="department">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let row">{{ row.departmentName || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button color="warn" (click)="removeMember(row)">
                    <mat-icon>person_remove</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .detail-card { padding: 24px !important; margin-bottom: 24px; }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      .label {
        display: block;
        font-size: 12px;
        color: var(--color-text-muted);
        text-transform: uppercase;
        margin-bottom: 4px;
      }
    }
    .members-card { padding: 0 !important; overflow: hidden; }
    .members-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border-light);
      h2 { font-size: 15px; font-weight: 600; margin: 0; }
    }
  `],
})
export class TeamDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private employeeService = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  team = signal<Team | null>(null);
  members = signal<Employee[]>([]);
  dataSource = new MatTableDataSource<Employee>([]);
  columns = ['name', 'email', 'position', 'department', 'actions'];

  private teamId = 0;

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.teamService
      .getById(this.teamId)
      .pipe(catchError(() => of(null)))
      .subscribe(team => {
        this.team.set(team);
        this.members.set(team?.members ?? []);
        this.dataSource.data = this.members();
        this.loading.set(false);
      });
  }

  openAddMember(): void {
    this.employeeService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(employees => {
        const existingIds = new Set(this.members().map(m => m.id));
        const available = employees.filter(e => !existingIds.has(e.id));

        const dialogRef = this.dialog.open(AddMemberDialogComponent, {
          width: '440px',
          data: { employees: available },
        });

        dialogRef
          .afterClosed()
          .pipe(
            filter(Boolean),
            switchMap((employeeId: number) => this.teamService.addMember(this.teamId, employeeId))
          )
          .subscribe({
            next: team => {
              this.team.set(team);
              this.members.set(team.members ?? []);
              this.dataSource.data = this.members();
              this.snackBar.open('Member added', 'OK', { duration: 3000 });
            },
            error: () => this.snackBar.open('Failed to add member', 'Dismiss', { duration: 4000 }),
          });
      });
  }

  removeMember(member: Employee): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Remove Member',
          message: `Remove "${member.username}" from this team?`,
          confirmLabel: 'Remove',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.teamService.removeMember(this.teamId, member.id))
      )
      .subscribe({
        next: team => {
          this.team.set(team);
          this.members.set(team.members ?? []);
          this.dataSource.data = this.members();
          this.snackBar.open('Member removed', 'OK', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to remove member', 'Dismiss', { duration: 4000 }),
      });
  }
}
