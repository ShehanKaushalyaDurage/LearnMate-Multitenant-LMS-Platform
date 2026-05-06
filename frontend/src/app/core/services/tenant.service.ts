/**
 * LearnHub — Tenant Service
 *
 * Stores the current institute slug (used in X-Tenant-Slug header).
 * Slug is persisted in localStorage so the user doesn't have to re-enter it.
 */
import { Injectable, signal } from '@angular/core';

const SLUG_KEY = 'lh_tenant_slug';

@Injectable({ providedIn: 'root' })
export class TenantService {
    /** Current tenant slug — read by auth interceptor */
    readonly slug = signal<string>(localStorage.getItem(SLUG_KEY) ?? '');

    setSlug(slug: string): void {
        localStorage.setItem(SLUG_KEY, slug);
        this.slug.set(slug);
    }

    clearSlug(): void {
        localStorage.removeItem(SLUG_KEY);
        this.slug.set('');
    }
}
