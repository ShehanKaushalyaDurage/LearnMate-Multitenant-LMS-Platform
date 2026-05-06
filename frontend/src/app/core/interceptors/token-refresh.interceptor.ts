/**
 * LearnHub — Token Refresh Interceptor
 *
 * On every 401 Unauthorized response:
 *  1. Calls POST /auth/refresh (httpOnly cookie carries the refresh token)
 *  2. Stores the new access token in AuthStateService
 *  3. Retries the original request ONCE with the new token
 *
 * On second 401 (refresh failed): clears auth state and redirects to login.
 */
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpErrorResponse,
    HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../services/auth-state.service';

/** Shared refresh-in-progress flag to avoid multiple simultaneous refresh calls */
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
    const authState = inject(AuthStateService);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Skip refresh endpoint itself to avoid infinite loop
    if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        return next(req);
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401) {
                return throwError(() => error);
            }

            if (isRefreshing) {
                // Another request is already refreshing — wait for it to finish then retry
                return refreshDone$.pipe(
                    filter((token): token is string => token !== null),
                    take(1),
                    switchMap((token) => next(addToken(req, token))),
                );
            }

            isRefreshing = true;
            refreshDone$.next(null);

            return authService.refreshToken().pipe(
                switchMap((res) => {
                    const newToken = (res as any).data?.accessToken || '';
                    isRefreshing = false;
                    refreshDone$.next(newToken);
                    return next(addToken(req, newToken));
                }),
                catchError((refreshErr) => {
                    isRefreshing = false;
                    refreshDone$.next(null);
                    authState.clearAuth();
                    router.navigate(['/auth/login']);
                    return throwError(() => refreshErr);
                }),
            );
        }),
    );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
