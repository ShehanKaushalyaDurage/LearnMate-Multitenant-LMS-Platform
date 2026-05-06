import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const TEACHER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./teacher-shell.component').then((m) => m.TeacherShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['TEACHER', 'ADMIN'] },
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/dashboard/teacher-dashboard.component').then(
                        (m) => m.TeacherDashboardComponent,
                    ),
            },
            {
                path: 'batches',
                loadComponent: () =>
                    import('./pages/batches/teacher-batches.component').then(
                        (m) => m.TeacherBatchesComponent,
                    ),
            },
            {
                path: 'timetable',
                loadComponent: () =>
                    import('./pages/timetable/teacher-timetable.component').then(
                        (m) => m.TeacherTimetableComponent,
                    ),
            },
            {
                path: 'assignments',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/assignments/teacher-assignments.component').then(
                                (m) => m.TeacherAssignmentsComponent,
                            ),
                    },
                    {
                        path: ':id/review',
                        loadComponent: () =>
                            import('./pages/assignments/teacher-assignment-review.component').then(
                                (m) => m.TeacherAssignmentReviewComponent,
                            ),
                    },
                ],
            },
            // Placeholders for future builds
            {
                path: 'exams',
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('../admin/pages/exams/exams.component').then((m) => m.AdminExamsComponent),
                    },
                    {
                        path: 'questions/:id',
                        loadComponent: () =>
                            import('../admin/pages/exams/question-builder.component').then(
                                (m) => m.QuestionBuilderComponent,
                            ),
                    },
                    {
                        path: 'results/:id',
                        loadComponent: () =>
                            import('../admin/pages/exams/exam-results.component').then(
                                (m) => m.AdminExamResultsComponent,
                            ),
                    },
                ],
            },
            {
                path: 'content',
                loadComponent: () =>
                    import('./pages/content/teacher-content.component').then(
                        (m) => m.TeacherContentComponent,
                    ),
            },
            {
                path: 'fees',
                loadComponent: () =>
                    import('./pages/fees/teacher-fees.component').then(
                        (m) => m.TeacherFeesComponent,
                    ),
            },
            { path: 'announcements', redirectTo: '', pathMatch: 'full' },
        ],
    },
];
