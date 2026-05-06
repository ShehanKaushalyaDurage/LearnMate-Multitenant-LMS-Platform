/**
 * LearnHub — Tenant Resolution Middleware
 *
 * Applied to all /api/tenant/* routes. Resolves the tenant from:
 *   1. Subdomain: {slug}.learnhub.lk (production)
 *   2. x-tenant-slug header (development / testing)
 *
 * On success, attaches to the request:
 *   - req.tenantConfig  → tenant metadata from master DB
 *   - req.tenantPrisma  → PrismaClient connected to the tenant's database
 *
 * On failure:
 *   - 400 if no slug can be resolved
 *   - 404 if tenant doesn't exist
 *   - 403 if tenant is suspended/deactivated
 */
import {
    Injectable,
    NestMiddleware,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { MasterPrismaService } from '../../prisma/master-prisma.service.js';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service.js';
import { EncryptionService } from '../utils/encryption.service.js';
import type { TenantConfig } from '../interfaces/index.js';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);
    private readonly appDomain: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly masterPrisma: MasterPrismaService,
        private readonly tenantPrisma: TenantPrismaService,
        private readonly encryptionService: EncryptionService,
    ) {
        this.appDomain = this.configService.get<string>('appDomain') || 'learnhub.lk';
    }

    async use(req: Request, _res: Response, next: NextFunction) {
        // 1. Extract tenant slug
        const slug = this.extractSlug(req);

        if (!slug) {
            throw new BadRequestException(
                'Tenant slug is required. Use subdomain or x-tenant-slug header.',
            );
        }

        // 2. Look up tenant in master DB
        const tenant = await this.masterPrisma.tenant.findUnique({
            where: { slug },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant "${slug}" not found`);
        }

        // 3. Check tenant status
        if (tenant.status !== 'ACTIVE') {
            throw new ForbiddenException(
                `Tenant "${slug}" is ${tenant.status.toLowerCase()}`,
            );
        }

        // 4. Build tenant config
        const tenantConfig: TenantConfig = {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            dbName: tenant.dbName,
            dbHost: tenant.dbHost,
            dbPort: tenant.dbPort,
            dbUser: tenant.dbUser,
            dbPasswordEncrypted: tenant.dbPasswordEncrypted,
            status: tenant.status,
            planId: tenant.planId,
        };

        // 5. Get tenant PrismaClient
        const decryptedPassword = this.encryptionService.decrypt(
            tenant.dbPasswordEncrypted,
        );

        const tenantClient = await this.tenantPrisma.getClientForTenant({
            tenantId: tenant.id,
            dbHost: tenant.dbHost,
            dbPort: tenant.dbPort,
            dbName: tenant.dbName,
            dbUser: tenant.dbUser,
            dbPassword: decryptedPassword,
        });

        // 6. Attach to request
        (req as any).tenantConfig = tenantConfig;
        (req as any).tenantPrisma = tenantClient;

        next();
    }

    /**
     * Extract tenant slug from subdomain or x-tenant-slug header.
     *
     * Subdomain example: "acme.learnhub.lk" → slug = "acme"
     * Header example: x-tenant-slug: acme
     */
    private extractSlug(req: Request): string | null {
        // Priority 1: x-tenant-slug header (useful for development / API testing)
        const headerSlug = req.headers['x-tenant-slug'];
        if (typeof headerSlug === 'string' && headerSlug.trim()) {
            return headerSlug.trim().toLowerCase();
        }

        // Priority 2: Subdomain extraction
        const host = req.hostname || req.headers.host || '';
        const hostWithoutPort = host.split(':')[0] ?? '';

        // Check if the host ends with our app domain
        if (hostWithoutPort.endsWith(`.${this.appDomain}`)) {
            const slug = hostWithoutPort.replace(`.${this.appDomain}`, '');
            if (slug && !slug.includes('.')) {
                return slug.toLowerCase();
            }
        }

        return null;
    }
}
