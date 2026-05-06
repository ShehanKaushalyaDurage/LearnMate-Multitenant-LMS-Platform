/**
 * LearnHub — Role Guard
 *
 * Protects routes based on user role.
 * Used in route data: { expectedRoles: ['ADMIN', 'TEACHER'] }
 */
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const expectedRoles = route.data['expectedRoles'] as string[] | undefined;

    if (!expectedRoles || expectedRoles.length === 0) {
        return true;
    }

    const userRole = authState.userRole();
    if (userRole && expectedRoles.includes(userRole)) {
        return true;
    }

    // Redirect to unauthorized page or dashboard
    router.navigate(['/unauthorized']);
    return false;
};
