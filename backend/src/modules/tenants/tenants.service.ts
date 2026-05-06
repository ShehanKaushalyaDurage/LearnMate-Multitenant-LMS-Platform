/**
 * LearnHub — Tenants Service
 *
 * Core tenant lifecycle management:
 * - provisionTenant(): Creates a new tenant's PostgreSQL database, runs
 *   SQL migrations directly (no Prisma CLI), seeds an initial admin user,
 *   and saves the tenant record to the master database.
 * - getTenants(): Paginated list of all tenants.
 * - getTenantBySlug(): Lookup by subdomain (used by tenant middleware).
 * - updateTenantStatus(): Activate, suspend, or deactivate a tenant.
 */
import {
    Injectable,
    Logger,
    ConflictException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MasterPrismaService } from '../../prisma/master-prisma.service.js';
import { TenantPrismaService, TenantDbConfig } from '../../prisma/tenant-prisma.service.js';
import { TenantMigrationsService } from './tenant-migrations.service.js';
import { EncryptionService } from '../../common/utils/encryption.service.js';
import { CreateTenantDto, UpdateTenantStatusDto, TenantQueryDto } from './dto/index.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        private readonly masterPrisma: MasterPrismaService,
        private readonly tenantPrisma: TenantPrismaService,
        private readonly tenantMigrations: TenantMigrationsService,
        private readonly encryptionService: EncryptionService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Provision a new tenant — full lifecycle:
     * 1. Validate slug uniqueness
     * 2. Create PostgreSQL database
     * 3. Run SQL migrations directly (no CLI, no execSync)
     * 4. Seed an initial admin user
     * 5. Save tenant record in master database
     *
     * @param dto - Tenant creation data
     * @returns The created tenant record (no encrypted password)
     */
    async provisionTenant(dto: CreateTenantDto) {
        this.logger.log(`📦 Provisioning new tenant: ${dto.name} (${dto.slug})`);

        // Step 1: Check if slug is already taken
        const existingTenant = await this.masterPrisma.tenant.findUnique({
            where: { slug: dto.slug },
        });
        if (existingTenant) {
            throw new ConflictException(`Slug "${dto.slug}" is already in use`);
        }

        // Derive database name from slug
        const dbName = `learnhub_tenant_${dto.slug.replace(/-/g, '_')}`;
        const dbHost = this.configService.get<string>('database.tenantHost', 'localhost');
        const dbPort = this.configService.get<number>('database.tenantPort', 5432);
        const dbUser = this.configService.get<string>('database.tenantUser', 'learnhub');
        const dbPassword = this.configService.get<string>('database.tenantPassword', '');

        const connectionUrl = `postgresql://${dbUser}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

        try {
            // Step 2: Create PostgreSQL database
            await this.createDatabase(dbName);
            this.logger.log(`✅ Database created: ${dbName}`);

            // Step 3: Run migrations directly via pg — no CLI, no config files
            await this.tenantMigrations.runMigrations(connectionUrl);
            this.logger.log(`✅ Migrations applied to: ${dbName}`);

            // Step 4: Seed the initial admin user into the tenant database
            await this.seedAdminUser(
                { tenantId: `provisioning-${dto.slug}`, dbHost, dbPort, dbName, dbUser, dbPassword },
                dto.adminEmail,
                dto.adminPassword,
                dto.adminFirstName,
                dto.adminLastName,
            );
            this.logger.log(`✅ Admin user seeded: ${dto.adminEmail}`);

            // Step 5: Save tenant record in master database
            const encryptedPassword = this.encryptionService.encrypt(dbPassword);

            const tenant = await this.masterPrisma.tenant.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    dbName,
                    dbHost,
                    dbPort,
                    dbUser,
                    dbPasswordEncrypted: encryptedPassword,
                    planId: dto.planId ?? null,
                    status: 'ACTIVE',
                    contactEmail: dto.contactEmail ?? null,
                    contactPhone: dto.contactPhone ?? null,
                    address: dto.address ?? null,
                },
                include: { plan: true },
            });

            this.logger.log(`🎉 Tenant provisioned successfully: ${tenant.name} (${tenant.id})`);

            // Return sanitized tenant (no encrypted password)
            const { dbPasswordEncrypted: _, ...safeTenant } = tenant;
            return safeTenant;

        } catch (error) {
            this.logger.error(`❌ Failed to provision tenant: ${dto.slug}`, error);

            // Attempt cleanup: drop the database if it was created
            try {
                await this.dropDatabase(dbName);
                this.logger.log(`🧹 Cleaned up database: ${dbName}`);
            } catch (cleanupError) {
                this.logger.error(`Failed to clean up database: ${dbName}`, cleanupError);
            }

            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerErrorException(
                `Failed to provision tenant: ${(error as Error).message}`,
            );
        }
    }

    /**
     * Get all tenants with pagination and optional filters
     */
    async getTenants(query: TenantQueryDto) {
        const { page = 1, limit = 20, search, status } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { contactEmail: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tenants, total] = await Promise.all([
            this.masterPrisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { plan: true },
                omit: { dbPasswordEncrypted: true },
            }),
            this.masterPrisma.tenant.count({ where }),
        ]);

        return {
            data: tenants,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Find a tenant by its subdomain slug (used by tenant resolution middleware)
     */
    async getTenantBySlug(slug: string) {
        const tenant = await this.masterPrisma.tenant.findUnique({
            where: { slug },
            include: { plan: true },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with slug "${slug}" not found`);
        }

        return tenant;
    }

    /**
     * Get a specific tenant by ID
     */
    async getTenantById(id: string) {
        const tenant = await this.masterPrisma.tenant.findUnique({
            where: { id },
            include: { plan: true, subscriptions: true },
            omit: { dbPasswordEncrypted: true },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with ID "${id}" not found`);
        }

        return tenant;
    }

    /**
     * Update a tenant's status (activate, suspend, deactivate)
     */
    async updateTenantStatus(id: string, dto: UpdateTenantStatusDto) {
        await this.getTenantById(id);

        const tenant = await this.masterPrisma.tenant.update({
            where: { id },
            data: { status: dto.status },
            include: { plan: true },
            omit: { dbPasswordEncrypted: true },
        });

        this.logger.log(`📋 Tenant ${tenant.slug} status updated to: ${dto.status}`);
        return tenant;
    }

    /**
     * Change a tenant's subscription plan
     */
    async updateTenantPlan(id: string, planId: string) {
        await this.getTenantById(id);

        const plan = await this.masterPrisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw new NotFoundException(`Plan with ID "${planId}" not found`);
        }

        const tenant = await this.masterPrisma.tenant.update({
            where: { id },
            data: { planId },
            include: { plan: true },
            omit: { dbPasswordEncrypted: true },
        });

        this.logger.log(`📋 Tenant ${tenant.slug} plan changed to: ${plan.name}`);
        return tenant;
    }

    /**
     * Update feature toggles for a tenant
     */
    async updateTenantFeatures(
        id: string,
        features: { enableExams?: boolean; enableAssignments?: boolean; enableAttendance?: boolean },
    ) {
        await this.getTenantById(id);

        const data: Record<string, boolean> = {};
        if (features.enableExams !== undefined) data.enableExams = features.enableExams;
        if (features.enableAssignments !== undefined) data.enableAssignments = features.enableAssignments;
        if (features.enableAttendance !== undefined) data.enableAttendance = features.enableAttendance;

        const tenant = await this.masterPrisma.tenant.update({
            where: { id },
            data,
            include: { plan: true },
            omit: { dbPasswordEncrypted: true },
        });

        this.logger.log(`🔧 Tenant ${tenant.slug} features updated`);
        return tenant;
    }

    /**
     * Get feature toggles for a tenant
     */
    async getTenantFeatures(id: string) {
        const tenant = await this.masterPrisma.tenant.findUnique({
            where: { id },
            select: {
                id: true,
                enableExams: true,
                enableAssignments: true,
                enableAttendance: true,
            },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with ID "${id}" not found`);
        }

        return tenant;
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================

    /**
     * Create a new PostgreSQL database for a tenant.
     * Uses the master connection — CREATE DATABASE cannot run inside a transaction.
     */
    private async createDatabase(dbName: string): Promise<void> {
        const safeName = dbName.replace(/[^a-zA-Z0-9_]/g, '');
        await this.masterPrisma.$executeRawUnsafe(`CREATE DATABASE "${safeName}"`);
    }

    /**
     * Drop a PostgreSQL database (cleanup on provisioning failure)
     */
    private async dropDatabase(dbName: string): Promise<void> {
        const safeName = dbName.replace(/[^a-zA-Z0-9_]/g, '');
        await this.masterPrisma.$executeRawUnsafe(
            `DROP DATABASE IF EXISTS "${safeName}"`,
        );
    }

    /**
     * Seed the initial admin user into a newly created tenant database
     */
    private async seedAdminUser(
        config: TenantDbConfig,
        email: string,
        password: string,
        firstName: string,
        lastName: string,
    ): Promise<void> {
        const client = await this.tenantPrisma.getClientForTenant(config);
        const hashedPassword = await bcrypt.hash(password, 12);

        await client.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
    }
}