/**
 * LearnHub — Application Routes
 *
 * Top-level routing with lazy-loaded feature modules.
 * Each role portal is a separate lazy-loaded route group.
 * Guards enforce authentication and role-based access.
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
    // --- Auth routes (public) ---
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    },

    // --- Institute Admin portal ---
    {
        path: 'admin',
        loadChildren: () =>
            import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    },

    // --- Teacher portal ---
    {
        path: 'teacher',
        loadChildren: () =>
            import('./features/teacher/teacher.routes').then((m) => m.TEACHER_ROUTES),
    },

    // --- Student portal ---
    {
        path: 'student',
        loadChildren: () =>
            import('./features/student/student.routes').then((m) => m.STUDENT_ROUTES),
    },

    // --- Parent portal ---
    {
        path: 'parent',
        loadChildren: () =>
            import('./features/parent/parent.routes').then((m) => m.PARENT_ROUTES),
    },

    // --- Super Admin (platform owner) ---
    {
        path: 'super-admin',
        loadChildren: () =>
            import('./features/super-admin/super-admin.routes').then(
                (m) => m.SUPER_ADMIN_ROUTES,
            ),
    },

    // --- Default redirect ---
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: '**', redirectTo: 'auth/login' },
];
