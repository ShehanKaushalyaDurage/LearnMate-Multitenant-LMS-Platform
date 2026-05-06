/**
 * LearnHub — Frontend Auth State Service Unit Tests
 */
import { TestBed } from '@angular/core/testing';
import { AuthStateService } from './auth-state.service';

const MOCK_USER = {
    id: 'u1',
    email: 'admin@school.lk',
    firstName: 'Kasun',
    lastName: 'Perera',
    role: 'ADMIN' as const,
};

describe('AuthStateService', () => {
    let svc: AuthStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        svc = TestBed.inject(AuthStateService);
    });

    it('should start unauthenticated', () => {
        expect(svc.isAuthenticated()).toBe(false);
        expect(svc.accessToken()).toBeNull();
        expect(svc.user()).toBeNull();
    });

    it('setAuth() should mark user as authenticated', () => {
        svc.setAuth('mock-token', MOCK_USER);
        expect(svc.isAuthenticated()).toBe(true);
        expect(svc.accessToken()).toBe('mock-token');
        expect(svc.user()?.email).toBe('admin@school.lk');
    });

    it('fullName computed signal returns correct value', () => {
        svc.setAuth('tok', MOCK_USER);
        expect(svc.fullName()).toBe('Kasun Perera');
    });

    it('role helpers return correct computed values', () => {
        svc.setAuth('tok', MOCK_USER);
        expect(svc.isAdmin()).toBe(true);
        expect(svc.isTeacher()).toBe(false);
        expect(svc.isStudent()).toBe(false);
        expect(svc.isParent()).toBe(false);
        expect(svc.isSuperAdmin()).toBe(false);
    });

    it('isSuperAdmin() should be true for SUPER_ADMIN role', () => {
        svc.setAuth('tok', { ...MOCK_USER, role: 'SUPER_ADMIN' });
        expect(svc.isSuperAdmin()).toBe(true);
        expect(svc.isAdmin()).toBe(false);
    });

    it('clearAuth() should reset state', () => {
        svc.setAuth('tok', MOCK_USER);
        svc.clearAuth();
        expect(svc.isAuthenticated()).toBe(false);
        expect(svc.user()).toBeNull();
        expect(svc.fullName()).toBe('');
    });

    it('updateToken() should update only the access token', () => {
        svc.setAuth('old-token', MOCK_USER);
        svc.updateToken('new-token');
        expect(svc.accessToken()).toBe('new-token');
        expect(svc.user()?.email).toBe('admin@school.lk'); // user unchanged
    });
});
