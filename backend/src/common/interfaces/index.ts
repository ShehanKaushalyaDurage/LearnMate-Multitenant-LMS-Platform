/**
 * LearnHub — Shared TypeScript Interfaces
 *
 * Defines interfaces used across the application
 * for type safety in request handling and service layers.
 */

/** JWT access token payload */
export interface JwtPayload {
    sub: string;        // User ID (UUID)
    email: string;
    role: string;       // UserRole enum value
    tenantId?: string;  // Tenant ID (UUID) — absent for platform admins
    iat?: number;
    exp?: number;
}

/** JWT refresh token payload */
export interface JwtRefreshPayload {
    sub: string;        // User ID (UUID)
    tenantId?: string;
    tokenVersion?: number;
}

/** Tenant configuration cached in Redis */
export interface TenantConfig {
    id: string;
    slug: string;
    name: string;
    dbName: string;
    dbHost: string;
    dbPort: number;
    dbUser: string;
    dbPasswordEncrypted: string;
    status: string;
    planId: string | null;
}

/** Extended Express Request with tenant context */
export interface TenantRequest extends Request {
    tenantConfig: TenantConfig;
    tenantPrisma: any; // PrismaClient — typed when Prisma is generated
    user?: JwtPayload;
}

/** Standard paginated response */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/** Standard API error response */
export interface ApiErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}
