/**
 * LearnHub — Roles Guard
 *
 * Checks the user's role against the required roles set by @Roles() decorator.
 * If no @Roles() metadata is present, the route is accessible to any authenticated user.
 *
 * Usage:
 *   @Roles(UserRole.ADMIN, UserRole.TEACHER)
 *   @Get('dashboard')
 *   getDashboard() { ... }
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/index.js';
import type { UserRole } from '../../../common/constants/index.js';
import type { JwtPayload } from '../../../common/interfaces/index.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No @Roles() decorator → allow any authenticated user
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: JwtPayload | undefined = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        const hasRole = requiredRoles.some(
            (role) => user.role === role,
        );

        if (!hasRole) {
            throw new ForbiddenException(
                `Requires one of: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
}
