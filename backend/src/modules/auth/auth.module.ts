/**
 * LearnHub — Auth Module
 *
 * Encapsulates authentication:
 * - JWT access token generation/validation (via @nestjs/jwt + Passport)
 * - Refresh token rotation (via httpOnly cookies)
 * - Dual login flows (tenant users + platform admins)
 * - Guards (JwtAuthGuard, RolesGuard) — applied globally in AppModule
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { EncryptionService } from '../../common/utils/encryption.service.js';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('jwt.secret'),
                signOptions: {
                    expiresIn: config.get<string>('jwt.accessExpiry', '15m') as any,
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        EncryptionService,
    ],
    exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { }
