/**
 * LearnHub — JWT Strategy (Passport)
 *
 * Extracts and validates JWT bearer tokens from the Authorization header.
 * On successful validation, attaches the decoded JwtPayload to request.user.
 *
 * Works for both tenant users and platform admins — the payload structure
 * (JwtPayload) contains an optional tenantId to distinguish between them.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../../../common/interfaces/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
            throw new Error('JWT_SECRET is not configured');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    /**
     * Called after JWT signature verification succeeds.
     * Return value is assigned to request.user.
     */
    validate(payload: JwtPayload): JwtPayload {
        if (!payload.sub || !payload.email) {
            throw new UnauthorizedException('Invalid token payload');
        }
        return payload;
    }
}
