import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const SUPER_ADMIN_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./super-admin-shell.component').then((m) => m.SuperAdminShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRoles: ['SUPER_ADMIN'] },
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/dashboard/super-admin-dashboard.component').then(
                        (m) => m.SuperAdminDashboardComponent,
                    ),
            },
            {
                path: 'tenants',
                loadComponent: () =>
                    import('./pages/tenants/super-admin-tenants.component').then(
                        (m) => m.SuperAdminTenantsComponent,
                    ),
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./pages/users/super-admin-users.component').then(
                        (m) => m.SuperAdminUsersComponent,
                    ),
            },
            {
                path: 'billing',
                loadComponent: () =>
                    import('./pages/billing/super-admin-billing.component').then(
                        (m) => m.SuperAdminBillingComponent,
                    ),
            },
            {
                path: 'audit',
                loadComponent: () =>
                    import('./pages/audit/super-admin-audit.component').then(
                        (m) => m.SuperAdminAuditComponent,
                    ),
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./pages/settings/super-admin-settings.component').then(
                        (m) => m.SuperAdminSettingsComponent,
                    ),
            },
        ],
    },
];
