/**
 * LearnHub — Auth Interceptor
 *
 * Attaches the JWT access token + X-Tenant-Slug to all outgoing API requests.
 * Token is stored in memory (signal) — never in localStorage.
 * Slug is persisted in localStorage via TenantService.
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';
import { TenantService } from '../services/tenant.service';

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
) => {
    const authState = inject(AuthStateService);
    const tenantService = inject(TenantService);

    const token = authState.accessToken();
    const slug = tenantService.slug();

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (slug) headers['X-Tenant-Slug'] = slug;

    if (Object.keys(headers).length > 0) {
        return next(req.clone({ setHeaders: headers }));
    }

    return next(req);
};
