import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const PARENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./parent-shell.component').then((m) => m.ParentShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['PARENT', 'ADMIN'] },
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/dashboard/parent-dashboard.component').then(
                        (m) => m.ParentDashboardComponent,
                    ),
            },
            {
                path: 'children',
                loadComponent: () =>
                    import('./pages/children/parent-children.component').then(
                        (m) => m.ParentChildrenComponent,
                    ),
            },
            {
                path: 'attendance',
                loadComponent: () =>
                    import('./pages/attendance/parent-attendance.component').then(
                        (m) => m.ParentAttendanceComponent,
                    ),
            },
            {
                path: 'assignments',
                loadComponent: () =>
                    import('./pages/assignments/parent-assignments.component').then(
                        (m) => m.ParentAssignmentsComponent,
                    ),
            },
            {
                path: 'fees',
                loadComponent: () =>
                    import('./pages/fees/parent-fees.component').then(
                        (m) => m.ParentFeesComponent,
                    ),
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./pages/announcements/parent-announcements.component').then(
                        (m) => m.ParentAnnouncementsComponent,
                    ),
            },
            {
                path: 'exams',
                loadComponent: () =>
                    import('./pages/exams/parent-exams.component').then(
                        (m) => m.ParentExamsComponent,
                    ),
            },
        ],
    },
];
