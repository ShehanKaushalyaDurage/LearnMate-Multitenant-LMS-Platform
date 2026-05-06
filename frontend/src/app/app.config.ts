/**
 * LearnHub — Angular Application Configuration
 *
 * Configures providers for the standalone Angular app:
 * - Router with lazy-loaded feature routes
 * - HttpClient with auth + token-refresh interceptors
 * - Angular Material animations
 * - APP_INITIALIZER: silent token refresh on startup
 */
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { catchError, EMPTY } from 'rxjs';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';
import { AuthService } from './core/services/auth.service';

function silentRefreshInitializer(): () => Promise<void> {
  return () => {
    const authService = inject(AuthService);
    return new Promise<void>((resolve) => {
      authService.refreshToken().pipe(
        catchError(() => EMPTY),
      ).subscribe({ complete: resolve, error: () => resolve() });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, tokenRefreshInterceptor]),
    ),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: silentRefreshInitializer,
      multi: true,
    },
  ],
};
