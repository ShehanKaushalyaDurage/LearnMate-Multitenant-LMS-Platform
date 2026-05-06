/**
 * LearnHub — Auth Guard Unit Tests
 */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
    let authState: AuthStateService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                AuthStateService,
                {
                    provide: Router,
                    useValue: { navigate: jest.fn(), parseUrl: jest.fn() },
                },
            ],
        });
        authState = TestBed.inject(AuthStateService);
        router = TestBed.inject(Router);
    });

    const runGuard = () =>
        TestBed.runInInjectionContext(() =>
            authGuard(
                {} as ActivatedRouteSnapshot,
                {} as RouterStateSnapshot,
            ),
        );

    it('should allow access when user is authenticated', () => {
        authState.setAuth('valid-token', {
            id: 'u1', email: 'a@b.com',
            firstName: 'A', lastName: 'B', role: 'ADMIN',
        });
        const result = runGuard();
        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /auth/login when user is NOT authenticated', () => {
        // start with no auth
        const result = runGuard();
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should redirect after clearAuth()', () => {
        authState.setAuth('tok', {
            id: 'u1', email: 'a@b.com',
            firstName: 'A', lastName: 'B', role: 'TEACHER',
        });
        authState.clearAuth();
        const result = runGuard();
        expect(result).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
});
