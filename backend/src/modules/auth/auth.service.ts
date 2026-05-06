/**
 * LearnHub — Authentication Service
 *
 * Handles authentication for both tenant users and platform admins:
 *
 * TENANT USERS:
 *   - Authenticated against the tenant's own database (User table)
 *   - Requires slug (from subdomain) to resolve the tenant
 *
 * PLATFORM ADMINS:
 *   - Authenticated against the master database (PlatformAdmin table)
 *   - Separate login endpoint, no slug needed
 *
 * TOKEN STRATEGY:
 *   - Access token: short-lived JWT (15m), sent in response body
 *   - Refresh token: long-lived JWT (7d), stored in httpOnly cookie
 *   - Refresh rotates both tokens for security
 */
import {
    Injectable,
    UnauthorizedException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { MasterPrismaService } from '../../prisma/master-prisma.service.js';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service.js';
import { EncryptionService } from '../../common/utils/encryption.service.js';
import type { JwtPayload, JwtRefreshPayload } from '../../common/interfaces/index.js';
import { COOKIE_NAMES } from '../../common/constants/index.js';
import type { LoginDto } from './dto/login.dto.js';
import type { PlatformLoginDto } from './dto/platform-login.dto.js';

/** Shape returned by login/refresh endpoints */
export interface AuthTokenResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        tenantId?: string;
    };
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly refreshSecret: string;
    private readonly refreshExpiry: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly masterPrisma: MasterPrismaService,
        private readonly tenantPrisma: TenantPrismaService,
        private readonly encryptionService: EncryptionService,
    ) {
        this.refreshSecret = this.configService.get<string>('jwt.refreshSecret') || '';
        this.refreshExpiry = this.configService.get<string>('jwt.refreshExpiry') || '7d';

        if (!this.refreshSecret) {
            throw new Error('JWT_REFRESH_SECRET is not configured');
        }
    }

    // ----------------------------------------------------------------
    // TENANT USER LOGIN
    // ----------------------------------------------------------------

    /**
     * Authenticate a user within a specific tenant's database.
     *
     * @param dto - Login credentials with tenant slug
     * @param res - Express response (for setting refresh cookie)
     */
    async tenantLogin(dto: LoginDto, res: Response): Promise<AuthTokenResponse> {
        const { email, password, slug } = dto;

        if (!slug) {
            throw new BadRequestException('Tenant slug is required');
        }

        // 1. Resolve tenant from master DB
        const tenant = await this.masterPrisma.tenant.findUnique({
            where: { slug },
        });

        if (!tenant) {
            throw new UnauthorizedException('Invalid tenant');
        }

        if (tenant.status !== 'ACTIVE') {
            throw new UnauthorizedException('Tenant is not active');
        }

        // 2. Get tenant Prisma client
        const decryptedPassword = this.encryptionService.decrypt(tenant.dbPasswordEncrypted);
        const tenantClient = await this.tenantPrisma.getClientForTenant({
            tenantId: tenant.id,
            dbHost: tenant.dbHost,
            dbPort: tenant.dbPort,
            dbName: tenant.dbName,
            dbUser: tenant.dbUser,
            dbPassword: decryptedPassword,
        });

        // 3. Find user in tenant DB
        const user = await tenantClient.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            throw new UnauthorizedException('Account is suspended or inactive');
        }

        // 4. Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 5. Generate tokens
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: tenant.id,
        };

        const tokens = this.generateTokenPair(payload);
        this.setRefreshCookie(res, tokens.refreshToken);

        this.logger.log(`✅ Tenant login: ${email} @ ${slug}`);

        return {
            accessToken: tokens.accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                tenantId: tenant.id,
            },
        };
    }

    // ----------------------------------------------------------------
    // PLATFORM ADMIN LOGIN
    // ----------------------------------------------------------------

    /**
     * Authenticate a platform super admin against the master database.
     */
    async platformLogin(dto: PlatformLoginDto, res: Response): Promise<AuthTokenResponse> {
        const { email, password } = dto;

        // 1. Find admin in master DB
        const admin = await this.masterPrisma.platformAdmin.findUnique({
            where: { email },
        });

        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // 3. Generate tokens (no tenantId for platform admins)
        const payload: JwtPayload = {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
        };

        const tokens = this.generateTokenPair(payload);
        this.setRefreshCookie(res, tokens.refreshToken);

        this.logger.log(`✅ Platform login: ${email}`);

        return {
            accessToken: tokens.accessToken,
            user: {
                id: admin.id,
                email: admin.email,
                firstName: admin.firstName,
                lastName: admin.lastName,
                role: admin.role,
            },
        };
    }

    // ----------------------------------------------------------------
    // REFRESH TOKENS
    // ----------------------------------------------------------------

    /**
     * Rotate access + refresh tokens using the httpOnly refresh cookie.
     * Issues a new token pair and sets a fresh cookie.
     */
    async refreshTokens(refreshToken: string, res: Response): Promise<{ accessToken: string }> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token not provided');
        }

        let decoded: JwtRefreshPayload;
        try {
            decoded = this.jwtService.verify<JwtRefreshPayload>(refreshToken, {
                secret: this.refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Build a new access token with fresh expiry
        // We re-fetch the user to ensure they haven't been deactivated since the last login
        let payload: JwtPayload;

        if (decoded.tenantId) {
            // Tenant user — need to verify user still exists and is active
            const tenant = await this.masterPrisma.tenant.findUnique({
                where: { id: decoded.tenantId },
            });

            if (!tenant || tenant.status !== 'ACTIVE') {
                throw new UnauthorizedException('Tenant is no longer active');
            }

            const decryptedPassword = this.encryptionService.decrypt(tenant.dbPasswordEncrypted);
            const tenantClient = await this.tenantPrisma.getClientForTenant({
                tenantId: tenant.id,
                dbHost: tenant.dbHost,
                dbPort: tenant.dbPort,
                dbName: tenant.dbName,
                dbUser: tenant.dbUser,
                dbPassword: decryptedPassword,
            });

            const user = await tenantClient.user.findUnique({
                where: { id: decoded.sub },
            });

            if (!user || user.status !== 'ACTIVE') {
                throw new UnauthorizedException('User account is no longer active');
            }

            payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
                tenantId: decoded.tenantId,
            };
        } else {
            // Platform admin
            const admin = await this.masterPrisma.platformAdmin.findUnique({
                where: { id: decoded.sub },
            });

            if (!admin) {
                throw new UnauthorizedException('Admin account not found');
            }

            payload = {
                sub: admin.id,
                email: admin.email,
                role: admin.role,
            };
        }

        const tokens = this.generateTokenPair(payload);
        this.setRefreshCookie(res, tokens.refreshToken);

        return { accessToken: tokens.accessToken };
    }

    // ----------------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------------

    /**
     * Clear the refresh token cookie.
     */
    logout(res: Response): void {
        res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
            httpOnly: true,
            secure: this.configService.get<string>('nodeEnv') === 'production',
            sameSite: 'strict',
            path: '/api/auth',
        });
        this.logger.log('🔓 User logged out');
    }

    // ----------------------------------------------------------------
    // GET CURRENT USER (from JWT payload)
    // ----------------------------------------------------------------

    /**
     * Returns the full user profile from the database based on JWT payload.
     */
    async getCurrentUser(payload: JwtPayload) {
        if (payload.tenantId) {
            // Tenant user
            const tenant = await this.masterPrisma.tenant.findUnique({
                where: { id: payload.tenantId },
            });

            if (!tenant) {
                throw new UnauthorizedException('Tenant not found');
            }

            const decryptedPassword = this.encryptionService.decrypt(tenant.dbPasswordEncrypted);
            const tenantClient = await this.tenantPrisma.getClientForTenant({
                tenantId: tenant.id,
                dbHost: tenant.dbHost,
                dbPort: tenant.dbPort,
                dbName: tenant.dbName,
                dbUser: tenant.dbUser,
                dbPassword: decryptedPassword,
            });

            const user = await tenantClient.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    avatarUrl: true,
                    createdAt: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return { ...user, tenantId: payload.tenantId, tenantName: tenant.name };
        }

        // Platform admin
        const admin = await this.masterPrisma.platformAdmin.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });

        if (!admin) {
            throw new UnauthorizedException('Admin not found');
        }

        return admin;
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================

    /**
     * Generate an access + refresh token pair.
     */
    private generateTokenPair(payload: JwtPayload) {
        // Cast to Record to satisfy JwtService overload signatures
        const accessToken = this.jwtService.sign({ ...payload } as Record<string, unknown>);

        const refreshPayload: JwtRefreshPayload = {
            sub: payload.sub,
            tenantId: payload.tenantId,
        };

        const refreshToken = this.jwtService.sign(
            { ...refreshPayload } as Record<string, unknown>,
            {
                secret: this.refreshSecret,
                expiresIn: this.refreshExpiry as any,
            },
        );

        return { accessToken, refreshToken };
    }

    /**
     * Set the refresh token as an httpOnly cookie.
     */
    private setRefreshCookie(res: Response, refreshToken: string): void {
        const isProduction = this.configService.get<string>('nodeEnv') === 'production';

        res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });
    }
}
