/**
 * LearnHub — Auth State Service
 *
 * Manages authentication state using Angular Signals.
 * - Access token kept in memory (signal) — NOT localStorage
 * - User profile info stored in signal
 * - Provides computed signals for auth status and role checks
 */
import { Injectable, signal, computed } from '@angular/core';

/** Authenticated user profile */
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SUPER_ADMIN';
    avatarUrl?: string;
}

@Injectable({
    providedIn: 'root',
})
export class AuthStateService {
    /** JWT access token — stored in memory only */
    readonly accessToken = signal<string | null>(null);

    /** Authenticated user profile */
    readonly user = signal<AuthUser | null>(null);

    /** Whether the user is currently authenticated */
    readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.user());

    /** Current user's role */
    readonly userRole = computed(() => this.user()?.role ?? null);

    /** Full name of the current user */
    readonly fullName = computed(() => {
        const u = this.user();
        return u ? `${u.firstName} ${u.lastName}` : '';
    });

    /** Role check helpers */
    readonly isAdmin = computed(() => this.userRole() === 'ADMIN');
    readonly isTeacher = computed(() => this.userRole() === 'TEACHER');
    readonly isStudent = computed(() => this.userRole() === 'STUDENT');
    readonly isParent = computed(() => this.userRole() === 'PARENT');
    readonly isSuperAdmin = computed(() => this.userRole() === 'SUPER_ADMIN');

    /**
     * Set authentication state after successful login
     */
    setAuth(token: string, user: AuthUser): void {
        this.accessToken.set(token);
        this.user.set(user);
    }

    /**
     * Clear authentication state on logout
     */
    clearAuth(): void {
        this.accessToken.set(null);
        this.user.set(null);
    }

    /**
     * Update only the access token (after refresh)
     */
    updateToken(token: string): void {
        this.accessToken.set(token);
    }
}
