/**
 * LearnHub — Auth Guard
 *
 * Protects routes that require authentication.
 * On cold start the APP_INITIALIZER performs a silent refresh — if no access
 * token is in memory yet, we give that one chance to complete before deciding
 * whether to redirect the user.
 */
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of, timeout } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authState = inject(AuthStateService);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Fast path — already authenticated
    if (authState.isAuthenticated()) {
        return true;
    }

    // Slow path — attempt a silent refresh (e.g. page reload with valid cookie)
    return authService.refreshToken().pipe(
        map(() => {
            // Refresh succeeded, let the route through
            return authState.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
        }),
        catchError(() => {
            // No refresh token or refresh failed — send to login
            return of(router.createUrlTree(['/auth/login']));
        }),
        timeout({ each: 5000, with: () => of(router.createUrlTree(['/auth/login'])) }),
    );
};
