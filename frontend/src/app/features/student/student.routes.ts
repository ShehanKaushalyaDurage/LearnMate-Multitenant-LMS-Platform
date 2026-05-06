import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const STUDENT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./student-shell.component').then((m) => m.StudentShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['STUDENT', 'ADMIN'] },
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/dashboard/student-dashboard.component').then(
                        (m) => m.StudentDashboardComponent,
                    ),
            },
            {
                path: 'courses',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/courses/student-courses.component').then(
                                (m) => m.StudentCoursesComponent,
                            ),
                    },
                    {
                        path: ':id/learn',
                        loadComponent: () =>
                            import('./pages/content/student-content.component').then(
                                (m) => m.StudentContentComponent,
                            ),
                    },
                ],
            },
            {
                path: 'timetable',
                loadComponent: () =>
                    import('./pages/timetable/student-timetable.component').then(
                        (m) => m.StudentTimetableComponent,
                    ),
            },
            {
                path: 'assignments',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/assignments/student-assignments.component').then(
                                (m) => m.StudentAssignmentsComponent,
                            ),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./pages/assignments/student-assignment-detail.component').then(
                                (m) => m.StudentAssignmentDetailComponent,
                            ),
                    },
                ],
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./pages/announcements/student-announcements.component').then(
                        (m) => m.StudentAnnouncementsComponent,
                    ),
            },
            {
                path: 'fees',
                loadComponent: () =>
                    import('./pages/fees/student-fees.component').then(
                        (m) => m.StudentFeesComponent,
                    ),
            },
            {
                path: 'certificates',
                loadComponent: () =>
                    import('./pages/certificates/student-certificates.component').then(
                        (m) => m.StudentCertificatesComponent,
                    ),
            },
            {
                path: 'exams',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/exams/student-exams.component').then(
                                (m) => m.StudentExamsComponent,
                            ),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./pages/exams/exam-interface.component').then(
                                (m) => m.ExamInterfaceComponent,
                            ),
                    },
                ],
            },
        ],
    },
];
