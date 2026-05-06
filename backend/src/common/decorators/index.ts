/**
 * LearnHub — Custom Decorators
 *
 * @CurrentUser()  — extracts the authenticated user from the request
 * @Roles()        — marks a route with required roles for RolesGuard
 * @TenantDb()     — extracts the tenant Prisma client from the request
 * @Public()       — marks a route as public (bypasses JWT guard)
 */
import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants';

// ----------------------------------------------------------------
// @CurrentUser() — Extract authenticated user from request
// Usage: @CurrentUser() user: JwtPayload
// ----------------------------------------------------------------
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);

// ----------------------------------------------------------------
// @Roles() — Set required roles metadata for RolesGuard
// Usage: @Roles(UserRole.ADMIN, UserRole.TEACHER)
// ----------------------------------------------------------------
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// ----------------------------------------------------------------
// @Public() — Bypass JWT authentication
// Usage: @Public()
// ----------------------------------------------------------------
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ----------------------------------------------------------------
// @TenantDb() — Extract tenant Prisma client from request
// Usage: @TenantDb() prisma: PrismaClient
// ----------------------------------------------------------------
export const TenantDb = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenantPrisma;
    },
);
