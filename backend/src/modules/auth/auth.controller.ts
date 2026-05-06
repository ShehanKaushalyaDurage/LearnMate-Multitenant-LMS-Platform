/**
 * LearnHub — Authentication Controller
 *
 * Endpoints:
 *   POST /api/auth/login           → Tenant user login
 *   POST /api/auth/platform-login  → Platform admin login
 *   POST /api/auth/refresh         → Refresh access token
 *   POST /api/auth/logout          → Clear refresh cookie
 *   GET  /api/auth/me              → Current user profile
 */
import {
    Controller,
    Post,
    Get,
    Body,
    Res,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { PlatformLoginDto } from './dto/platform-login.dto.js';
import { Public } from '../../common/decorators/index.js';
import { CurrentUser } from '../../common/decorators/index.js';
import { COOKIE_NAMES } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // ----------------------------------------------------------------
    // TENANT USER LOGIN
    // ----------------------------------------------------------------

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        // If slug is missing in body but present in header, use it
        if (!dto.slug) {
            const headerSlug = req.headers['x-tenant-slug'];
            if (typeof headerSlug === 'string') {
                dto.slug = headerSlug;
            }
        }
        return this.authService.tenantLogin(dto, res);
    }

    // ----------------------------------------------------------------
    // PLATFORM ADMIN LOGIN
    // ----------------------------------------------------------------

    @Public()
    @Post('platform-login')
    @HttpCode(HttpStatus.OK)
    async platformLogin(
        @Body() dto: PlatformLoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.platformLogin(dto, res);
    }

    // ----------------------------------------------------------------
    // REFRESH TOKEN
    // ----------------------------------------------------------------

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
        return this.authService.refreshTokens(refreshToken || '', res);
    }

    // ----------------------------------------------------------------
    // LOGOUT
    // ----------------------------------------------------------------

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Res({ passthrough: true }) res: Response) {
        this.authService.logout(res);
        return { message: 'Logged out successfully' };
    }

    // ----------------------------------------------------------------
    // CURRENT USER PROFILE
    // ----------------------------------------------------------------

    @Get('me')
    async getMe(@CurrentUser() user: JwtPayload) {
        return this.authService.getCurrentUser(user);
    }
}
