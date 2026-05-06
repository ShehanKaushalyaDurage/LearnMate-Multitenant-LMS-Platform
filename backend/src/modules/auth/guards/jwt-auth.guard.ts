/**
 * LearnHub — JWT Auth Guard
 *
 * Global guard that requires a valid JWT bearer token on every route.
 * Routes decorated with @Public() bypass this guard.
 *
 * Usage:
 *   - Applied globally in AppModule
 *   - Opt out with: @Public() on controller or handler
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators/index.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if the route is marked as @Public()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // Proceed with standard JWT validation
        return super.canActivate(context);
    }
}
