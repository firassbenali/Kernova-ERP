import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { adminGuard } from './core/auth/admin.guard';
import { guestGuard } from './core/auth/guest.guard';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'rh/employees',
        loadComponent: () =>
          import('./features/rh/employees/employee-list/employee-list.component').then(
            m => m.EmployeeListComponent
          ),
      },
      {
        path: 'rh/employees/:id',
        loadComponent: () =>
          import('./features/rh/employees/employee-detail/employee-detail.component').then(
            m => m.EmployeeDetailComponent
          ),
      },
      {
        path: 'rh/departments',
        loadComponent: () =>
          import('./features/rh/departments/department-list/department-list.component').then(
            m => m.DepartmentListComponent
          ),
      },
      {
        path: 'rh/positions',
        loadComponent: () =>
          import('./features/rh/positions/position-list/position-list.component').then(
            m => m.PositionListComponent
          ),
      },
      {
        path: 'rh/skills',
        loadComponent: () =>
          import('./features/rh/skills/skill-list/skill-list.component').then(
            m => m.SkillListComponent
          ),
      },
      {
        path: 'rh/skills/catalog',
        loadComponent: () =>
          import('./features/rh/skills/skill-catalog/skill-catalog.component').then(
            m => m.SkillCatalogComponent
          ),
      },
      {
        path: 'rh/skills/gap-dashboard',
        loadComponent: () =>
          import('./features/rh/skills/skill-gap-dashboard/skill-gap-dashboard.component').then(
            m => m.SkillGapDashboardComponent
          ),
      },
      {
        path: 'rh/skills/employee-matching',
        loadComponent: () =>
          import('./features/rh/skills/employee-matching/employee-matching.component').then(
            m => m.EmployeeMatchingComponent
          ),
      },
      {
        path: 'rh/employees/:id/competencies',
        loadComponent: () =>
          import('./features/rh/employees/employee-competencies/employee-competencies.component').then(
            m => m.EmployeeCompetenciesComponent
          ),
      },
      {
        path: 'rh/positions/requirements',
        loadComponent: () =>
          import('./features/rh/positions/position-requirements/position-requirements.component').then(
            m => m.PositionRequirementsComponent
          ),
      },
      {
        path: 'rh/teams',
        loadComponent: () =>
          import('./features/rh/teams/team-list/team-list.component').then(
            m => m.TeamListComponent
          ),
      },
      {
        path: 'rh/teams/:id',
        loadComponent: () =>
          import('./features/rh/teams/team-detail/team-detail.component').then(
            m => m.TeamDetailComponent
          ),
      },
      {
        path: 'rh/performance',
        loadComponent: () =>
          import('./features/rh/performance/performance-dashboard/performance-dashboard.component').then(
            m => m.PerformanceDashboardComponent
          ),
      },
      {
        path: 'rh/performance/reviews',
        loadComponent: () =>
          import('./features/rh/performance/performance-list/performance-list.component').then(
            m => m.PerformanceListComponent
          ),
      },
      {
        path: 'rh/performance/:id',
        loadComponent: () =>
          import('./features/rh/performance/performance-detail/performance-detail.component').then(
            m => m.PerformanceDetailComponent
          ),
      },
      {
        path: 'rh/employees/:id/performance',
        loadComponent: () =>
          import('./features/rh/performance/employee-performance/employee-performance.component').then(
            m => m.EmployeePerformanceComponent
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(
            m => m.ProjectListComponent
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component').then(
            m => m.ProjectDetailComponent
          ),
      },
      {
        path: 'projects/:id/tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
      },
      {
        path: 'projects/:id/documents',
        loadComponent: () =>
          import('./features/projects/documents/document-list/document-list.component').then(
            m => m.DocumentListComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/projects/documents/documents-hub/documents-hub.component').then(
            m => m.DocumentsHubComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.component').then(
            m => m.NotificationsComponent
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then(
            m => m.UserListComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-placeholder/settings-placeholder.component').then(
            m => m.SettingsPlaceholderComponent
          ),
      },
      {
        path: 'rh/resource-planning',
        loadComponent: () =>
          import('./features/rh/resource-planning/resource-planning-dashboard/resource-planning-dashboard.component').then(
            m => m.ResourcePlanningDashboardComponent
          ),
      },
      {
        path: 'rh/resource-planning/allocations',
        loadComponent: () =>
          import('./features/rh/resource-planning/resource-allocation-list/resource-allocation-list.component').then(
            m => m.ResourceAllocationListComponent
          ),
      },
      {
        path: 'rh/resource-planning/employees/:employeeId/workload',
        loadComponent: () =>
          import('./features/rh/resource-planning/employee-resource-view/employee-resource-view.component').then(
            m => m.EmployeeResourceViewComponent
          ),
      },
      {
        path: 'rh/resource-planning/projects/:projectId/allocation',
        loadComponent: () =>
          import('./features/rh/resource-planning/project-allocation-view/project-allocation-view.component').then(
            m => m.ProjectAllocationViewComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
