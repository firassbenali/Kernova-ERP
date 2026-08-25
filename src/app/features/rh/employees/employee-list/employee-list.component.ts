import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { EmployeeService } from '../../../../core/services/employee.service';
import { Employee } from '../../../../domain/models/employee.model';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import {
  EmployeeFormDialogComponent,
  EmployeeDialogData,
} from '../employee-form-dialog/employee-form-dialog.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
    StatusChipComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Employees</h1>
        <div class="page-header-actions">
          <button mat-flat-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Employee
          </button>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <div class="search-bar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Name, email, department..." />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
        </div>

        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="badge" title="No employees" message="Add employees to manage your workforce." />
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/rh/employees', row.id]" class="link">{{ row.username }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="userEmail">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let row">{{ row.userEmail }}</td>
            </ng-container>
            <ng-container matColumnDef="departmentName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Department</th>
              <td mat-cell *matCellDef="let row">{{ row.departmentName }}</td>
            </ng-container>
            <ng-container matColumnDef="positionTitle">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Position</th>
              <td mat-cell *matCellDef="let row">{{ row.positionTitle }}</td>
            </ng-container>
            <ng-container matColumnDef="availability">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Availability</th>
              <td mat-cell *matCellDef="let row">
                <app-status-chip [status]="row.availability" type="availability"></app-status-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button [matMenuTriggerFor]="menu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu">
                  <button mat-menu-item [routerLink]="['/rh/employees', row.id]">
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
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }
  `],
})
export class EmployeeListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private service = inject(EmployeeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<Employee>([]);
  columns = ['username', 'userEmail', 'departmentName', 'positionTitle', 'availability', 'actions'];

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data, filter) => {
      const term = filter.toLowerCase();
      return (
        data.username.toLowerCase().includes(term) ||
        data.userEmail.toLowerCase().includes(term) ||
        data.departmentName.toLowerCase().includes(term) ||
        data.positionTitle.toLowerCase().includes(term)
      );
    };
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
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

  openDialog(employee?: Employee): void {
    this.dialog
      .open(EmployeeFormDialogComponent, {
        width: '480px',
        data: { employee } satisfies EmployeeDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(form =>
          employee ? this.service.update(employee.id, form) : this.service.create(form)
        )
      )
      .subscribe({
        next: () => {
          this.snackBar.open(employee ? 'Employee updated' : 'Employee created', 'OK', {
            duration: 3000,
          });
          this.load();
        },
        error: () => this.snackBar.open('Operation failed', 'Dismiss', { duration: 4000 }),
      });
  }

  delete(employee: Employee): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Employee',
          message: `Delete ${employee.username}?`,
          confirmLabel: 'Delete',
          danger: true,
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.service.delete(employee.id))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Employee deleted', 'OK', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Delete failed', 'Dismiss', { duration: 4000 }),
      });
  }
}
