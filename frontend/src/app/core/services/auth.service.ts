/**
 * LearnHub — Auth Service
 *
 * Handles login, logout, and token refresh against the NestJS backend.
 * Works with AuthStateService (access token in memory) and TenantService (slug).
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { AuthStateService, type AuthUser } from './auth-state.service';
import { TenantService } from './tenant.service';
import { environment } from '../../../environments/environment';

interface LoginResponse {
    data: {
        accessToken: string;
        user: AuthUser;
    };
}

interface RefreshResponse {
    data: { accessToken: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly authState = inject(AuthStateService);
    private readonly tenantService = inject(TenantService);
    private readonly router = inject(Router);

    private readonly baseUrl = environment.apiBaseUrl;

    /** Map role → portal route */
    private readonly roleRoutes: Record<string, string> = {
        ADMIN: '/admin',
        TEACHER: '/teacher',
        STUDENT: '/student',
        PARENT: '/parent',
        SUPER_ADMIN: '/super-admin',
    };

    login(slug: string, email: string, password: string) {
        this.tenantService.setSlug(slug);

        return this.http.post<LoginResponse>(
            `${this.baseUrl}/auth/login`,
            { slug, email, password },
            { headers: { 'X-Tenant-Slug': slug }, withCredentials: true },
        ).pipe(
            tap((res) => {
                const { accessToken, user } = res.data;
                this.authState.setAuth(accessToken, user);

                const route = this.roleRoutes[user.role] ?? '/auth/login';
                this.router.navigate([route]);
            }),
        );
    }

    /** Platform Admin login — no tenant slug required */
    platformLogin(email: string, password: string) {
        return this.http.post<LoginResponse>(
            `${this.baseUrl}/auth/platform-login`,
            { email, password },
            { withCredentials: true },
        ).pipe(
            tap((res) => {
                const { accessToken, user } = res.data;
                this.authState.setAuth(accessToken, user);
                this.router.navigate(['/super-admin']);
            }),
        );
    }

    logout() {
        const slug = this.tenantService.slug();
        this.http.post(
            `${this.baseUrl}/auth/logout`,
            {},
            { headers: { 'X-Tenant-Slug': slug }, withCredentials: true },
        ).pipe(catchError(() => EMPTY)).subscribe(() => {
            this.authState.clearAuth();
            this.router.navigate(['/auth/login']);
        });
    }

    refreshToken() {
        const slug = this.tenantService.slug();
        return this.http.post<RefreshResponse>(
            `${this.baseUrl}/auth/refresh`,
            {},
            { headers: { 'X-Tenant-Slug': slug }, withCredentials: true },
        ).pipe(
            tap((res) => this.authState.updateToken(res.data.accessToken)),
        );
    }
}
