/**
 * LearnHub — Admin Feature Routes
 */
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./admin-shell.component').then((m) => m.AdminShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['ADMIN'] },
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/dashboard/dashboard.component').then(
                        (m) => m.AdminDashboardComponent,
                    ),
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./pages/users/users.component').then((m) => m.AdminUsersComponent),
            },
            {
                path: 'classes',
                loadComponent: () =>
                    import('./pages/courses/courses.component').then((m) => m.AdminCoursesComponent),
            },
            {
                path: 'batches',
                loadComponent: () =>
                    import('./pages/batches/batches.component').then((m) => m.AdminBatchesComponent),
            },
            // Placeholder routes for future builds
            {
                path: 'timetable',
                loadComponent: () =>
                    import('./pages/timetable/timetable.component').then((m) => m.AdminTimetableComponent),
            },
            // Attendance hidden by default (Req 9)
            // { path: 'attendance', loadComponent: () => import('./pages/attendance/attendance.component').then((m) => m.AdminAttendanceComponent) },
            {
                path: 'assignments',
                loadComponent: () =>
                    import('./pages/assignments/assignments.component').then((m) => m.AdminAssignmentsComponent),
            },
            {
                path: 'exams',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/exams/exams.component').then((m) => m.AdminExamsComponent),
                    },
                    {
                        path: 'questions/:id',
                        loadComponent: () =>
                            import('./pages/exams/question-builder.component').then(
                                (m) => m.QuestionBuilderComponent,
                            ),
                    },
                    {
                        path: 'results/:id',
                        loadComponent: () =>
                            import('./pages/exams/exam-results.component').then(
                                (m) => m.AdminExamResultsComponent,
                            ),
                    },
                ],
            },
            {
                path: 'fees',
                loadComponent: () =>
                    import('./pages/fees/fees.component').then((m) => m.AdminFeesComponent),
            },
            {
                path: 'content',
                loadComponent: () =>
                    import('./pages/content/content.component').then((m) => m.AdminContentComponent),
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./pages/announcements/announcements.component').then((m) => m.AdminAnnouncementsComponent),
            },
            // Certificates hidden (Req 13)
            // { path: 'certificates', loadComponent: () => import('./pages/certificates/certificates.component').then((m) => m.AdminCertificatesComponent) },
            { path: 'audit-logs', redirectTo: '', pathMatch: 'full' },
        ],
    },
];

