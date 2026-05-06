import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * LogoutComponent — performs programmatic logout and redirects to /auth/login.
 * Routed at /auth/logout for sidebar Sign-out links.
 * AuthService.logout() already handles clearAuth() + router.navigate internally.
 */
@Component({
    selector: 'app-logout',
    standalone: true,
    imports: [],
    template: `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748B;font-size:1rem;">
        Signing out…
    </div>`,
})
export class LogoutComponent implements OnInit {
    private readonly authService = inject(AuthService);

    ngOnInit() {
        // logout() is void — it calls clearAuth() + router.navigate(['/auth/login']) itself
        this.authService.logout();
    }
}
