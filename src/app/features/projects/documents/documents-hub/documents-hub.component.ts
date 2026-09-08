import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ProjectService } from '../../../../core/services/project.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { ResourcePlanningService } from '../../../../core/services/resource-planning.service';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Project } from '../../../../domain/models/project.model';
import { ProjectDocument } from '../../../../domain/models/project-document.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';

interface DocumentRow extends ProjectDocument {
  projectName: string;
}

@Component({
  selector: 'app-documents-hub',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EmptyStateComponent,
    LoadingOverlayComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Documents</h1>
        <div class="page-header-actions">
          <a mat-stroked-button routerLink="/projects">
            <mat-icon>folder_open</mat-icon> View Projects
          </a>
        </div>
      </div>

      <div class="section-card" style="position: relative">
        <app-loading-overlay [loading]="loading()"></app-loading-overlay>

        @if (!loading() && dataSource.data.length === 0) {
          <app-empty-state icon="description" title="No documents" message="Documents from your assigned projects will appear here." />
        } @else {
          <table mat-table [dataSource]="dataSource" class="w-full">
            <ng-container matColumnDef="projectName">
              <th mat-header-cell *matHeaderCellDef>Project</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/projects', row.projectId, 'documents']" class="link">{{ row.projectName }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Title</th>
              <td mat-cell *matCellDef="let row">{{ row.title }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let row">{{ row.category || 'General' }}</td>
            </ng-container>
            <ng-container matColumnDef="version">
              <th mat-header-cell *matHeaderCellDef>Version</th>
              <td mat-cell *matCellDef="let row">v{{ row.version || '1.0' }}</td>
            </ng-container>
            <ng-container matColumnDef="uploadedAt">
              <th mat-header-cell *matHeaderCellDef>Uploaded</th>
              <td mat-cell *matCellDef="let row">{{ row.uploadedAt || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="download(row)" matTooltip="Download document">
                  <mat-icon color="primary">download</mat-icon>
                </button>
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
    .link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
  `],
})
export class DocumentsHubComponent implements OnInit {
  private service = inject(ProjectService);
  private employeeService = inject(EmployeeService);
  private resourceService = inject(ResourcePlanningService);
  private taskService = inject(TaskService);
  readonly authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  dataSource = new MatTableDataSource<DocumentRow>([]);
  columns = ['projectName', 'title', 'category', 'version', 'uploadedAt', 'actions'];

  ngOnInit(): void {
    this.loading.set(true);
    this.service
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe(allProjects => {
        if (allProjects.length === 0) {
          this.loading.set(false);
          return;
        }

        if (this.authService.isEmployee()) {
          const currentUser = this.authService.currentUser();
          if (!currentUser) {
            this.dataSource.data = [];
            this.loading.set(false);
            return;
          }

          this.employeeService.getAll().pipe(
            catchError(() => of([])),
            switchMap(employees => {
              const myEmp = employees.find(e => e.userId === currentUser.id);
              const empId = myEmp ? myEmp.id : currentUser.id;

              return forkJoin({
                allocations: this.resourceService.getAllocationsByEmployee(empId).pipe(catchError(() => of([]))),
                tasks: this.taskService.getByEmployee(empId).pipe(catchError(() => of([]))),
              });
            })
          ).subscribe(({ allocations, tasks }: { allocations: any[]; tasks: any[] }) => {
            const assignedProjectIds = new Set<number>();
            allocations.forEach((a: any) => { if (a.projectId) assignedProjectIds.add(a.projectId); });
            tasks.forEach((t: any) => { if (t.projectId) assignedProjectIds.add(t.projectId); });

            const myProjects = allProjects.filter(p => assignedProjectIds.has(p.id));
            this.loadDocumentsForProjects(myProjects);
          });
        } else {
          this.loadDocumentsForProjects(allProjects);
        }
      });
  }

  private loadDocumentsForProjects(projects: Project[]): void {
    if (projects.length === 0) {
      this.dataSource.data = [];
      this.loading.set(false);
      return;
    }

    forkJoin(
      projects.map(p =>
        this.service.getDocuments(p.id).pipe(catchError(() => of<ProjectDocument[]>([])))
      )
    ).subscribe({
      next: docLists => {
        const rows: DocumentRow[] = [];
        docLists.forEach((docs, i) => {
          const project = projects[i];
          docs.forEach(d => rows.push({ ...d, projectName: project.name }));
        });
        this.dataSource.data = rows;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load documents', 'Dismiss', { duration: 4000 });
      },
    });
  }

  download(doc: DocumentRow): void {
    this.service.downloadDocument(doc.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.title || 'document';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Download failed', 'Dismiss', { duration: 4000 }),
    });
  }
}
