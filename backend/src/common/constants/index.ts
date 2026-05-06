/**
 * LearnHub — Application Constants
 *
 * Centralized constants used across the application.
 */

/** Roles available within a tenant */
export enum UserRole {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
}

/** Platform-level roles (super admin) */
export enum PlatformRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
}

/** Tenant status values */
export enum TenantStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
    DEACTIVATED = 'DEACTIVATED',
}

/** Cache TTL values (in seconds) */
export const CACHE_TTL = {
    TENANT_CONFIG: 300,      // 5 minutes
    USER_SESSION: 900,       // 15 minutes
    DASHBOARD_STATS: 600,    // 10 minutes
} as const;

/** Cookie names */
export const COOKIE_NAMES = {
    REFRESH_TOKEN: 'learnhub_refresh_token',
} as const;

/** Pagination defaults */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;
