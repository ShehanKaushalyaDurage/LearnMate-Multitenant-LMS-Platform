/**
 * LearnHub — Platform Admin Service
 *
 * Operates on the MASTER database (not tenant-scoped).
 * Manages subscription plans, tenant subscriptions, platform stats,
 * tenant listings, platform admins, and billing invoices.
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MasterPrismaService } from '../../prisma/master-prisma.service.js';
import { TenantStatus } from '../../common/constants/index.js';
import type {
    CreatePlanDto,
    UpdatePlanDto,
    CreateSubscriptionDto,
    UpdateSubscriptionStatusDto,
} from './dto/index.js';

@Injectable()
export class PlatformService {
    private readonly logger = new Logger(PlatformService.name);

    constructor(private readonly masterPrisma: MasterPrismaService) { }

    // ----------------------------------------------------------------
    // PLANS
    // ----------------------------------------------------------------

    async getPlans() {
        return this.masterPrisma.plan.findMany({
            orderBy: { priceLkr: 'asc' },
            select: {
                id: true, name: true, maxStudents: true, maxTeachers: true,
                maxCourses: true, priceLkr: true, isActive: true, createdAt: true,
                _count: { select: { tenants: true } },
            },
        });
    }

    async getPlanById(id: string) {
        const plan = await this.masterPrisma.plan.findUnique({
            where: { id },
            select: {
                id: true, name: true, maxStudents: true, maxTeachers: true,
                maxCourses: true, priceLkr: true, featuresJson: true, isActive: true,
                createdAt: true, updatedAt: true,
                _count: { select: { tenants: true, subscriptions: true } },
            },
        });
        if (!plan) throw new NotFoundException(`Plan "${id}" not found`);
        return plan;
    }

    async createPlan(dto: CreatePlanDto) {
        const plan = await this.masterPrisma.plan.create({
            data: {
                name: dto.name,
                maxStudents: dto.maxStudents,
                maxTeachers: dto.maxTeachers,
                maxCourses: dto.maxCourses,
                priceLkr: dto.priceLkr,
            },
        });
        this.logger.log(`✅ Created plan: ${plan.name} @ LKR ${plan.priceLkr}`);
        return plan;
    }

    async updatePlan(id: string, dto: UpdatePlanDto) {
        const plan = await this.masterPrisma.plan.findUnique({ where: { id } });
        if (!plan) throw new NotFoundException(`Plan "${id}" not found`);

        const data: Record<string, unknown> = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.maxStudents !== undefined) data.maxStudents = dto.maxStudents;
        if (dto.maxTeachers !== undefined) data.maxTeachers = dto.maxTeachers;
        if (dto.maxCourses !== undefined) data.maxCourses = dto.maxCourses;
        if (dto.priceLkr !== undefined) data.priceLkr = dto.priceLkr;
        if (dto.isActive !== undefined) data.isActive = dto.isActive;

        return this.masterPrisma.plan.update({ where: { id }, data });
    }

    // ----------------------------------------------------------------
    // SUBSCRIPTIONS
    // ----------------------------------------------------------------

    async getTenantSubscriptions(tenantId: string) {
        const tenant = await this.masterPrisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) throw new NotFoundException(`Tenant "${tenantId}" not found`);

        return this.masterPrisma.subscription.findMany({
            where: { tenantId },
            include: { plan: { select: { id: true, name: true, priceLkr: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createSubscription(dto: CreateSubscriptionDto) {
        const [tenant, plan] = await Promise.all([
            this.masterPrisma.tenant.findUnique({ where: { id: dto.tenantId } }),
            this.masterPrisma.plan.findUnique({ where: { id: dto.planId } }),
        ]);
        if (!tenant) throw new NotFoundException(`Tenant "${dto.tenantId}" not found`);
        if (!plan) throw new NotFoundException(`Plan "${dto.planId}" not found`);

        // Update tenant's planId at the same time
        const [subscription] = await Promise.all([
            this.masterPrisma.subscription.create({
                data: {
                    tenantId: dto.tenantId,
                    planId: dto.planId,
                    currentPeriodStart: new Date(dto.currentPeriodStart),
                    currentPeriodEnd: new Date(dto.currentPeriodEnd),
                    payhereSubscriptionId: dto.payhereSubscriptionId,
                },
                include: { plan: { select: { id: true, name: true, priceLkr: true } } },
            }),
            this.masterPrisma.tenant.update({
                where: { id: dto.tenantId },
                data: { planId: dto.planId },
            }),
        ]);

        this.logger.log(`💳 Subscription: tenant ${tenant.slug} → plan ${plan.name}`);
        return subscription;
    }

    async updateSubscriptionStatus(id: string, dto: UpdateSubscriptionStatusDto) {
        const sub = await this.masterPrisma.subscription.findUnique({ where: { id } });
        if (!sub) throw new NotFoundException(`Subscription "${id}" not found`);

        return this.masterPrisma.subscription.update({
            where: { id },
            data: { status: dto.status },
        });
    }

    // ----------------------------------------------------------------
    // PLATFORM STATS (Dashboard)
    // ----------------------------------------------------------------

    async getPlatformStats() {
        const [
            totalTenants,
            activeTenants,
            suspendedTenants,
            totalPlans,
            activeSubscriptions,
            activeSubscriptionsWithPrice,
            planBreakdown,
        ] = await Promise.all([
            this.masterPrisma.tenant.count(),
            this.masterPrisma.tenant.count({ where: { status: 'ACTIVE' } }),
            this.masterPrisma.tenant.count({ where: { status: 'SUSPENDED' } }),
            this.masterPrisma.plan.count({ where: { isActive: true } }),
            this.masterPrisma.subscription.count({ where: { status: 'ACTIVE' } }),
            this.masterPrisma.subscription.findMany({
                where: { status: 'ACTIVE' },
                select: { plan: { select: { priceLkr: true } } },
            }),
            this.masterPrisma.plan.findMany({
                where: { isActive: true },
                select: {
                    id: true, name: true, priceLkr: true,
                    _count: { select: { tenants: true } },
                },
                orderBy: { priceLkr: 'asc' },
            }),
        ]);

        const mrr = activeSubscriptionsWithPrice.reduce(
            (sum, s) => sum + Number(s.plan.priceLkr),
            0,
        );

        return {
            tenants: { total: totalTenants, active: activeTenants, suspended: suspendedTenants },
            plans: { total: totalPlans, breakdown: planBreakdown },
            subscriptions: { active: activeSubscriptions, mrr },
        };
    }

    // ----------------------------------------------------------------
    // TENANTS LIST (Super Admin Portal)
    // ----------------------------------------------------------------

    async getTenants(page = 1, limit = 20, search?: string, status?: string) {
        const where: Record<string, any> = {};
        if (status) where['status'] = status;
        if (search) {
            where['OR'] = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, data] = await Promise.all([
            this.masterPrisma.tenant.count({ where }),
            this.masterPrisma.tenant.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    plan: { select: { id: true, name: true, priceLkr: true } },
                    _count: { select: { subscriptions: true } },
                },
            }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async updateTenantStatus(id: string, status: string) {
        const tenant = await this.masterPrisma.tenant.findUnique({ where: { id } });
        if (!tenant) throw new NotFoundException(`Tenant "${id}" not found`);
        return this.masterPrisma.tenant.update({
            where: { id },
            data: { status: status as TenantStatus },
        });
    }

    // ----------------------------------------------------------------
    // PLATFORM ADMINS
    // ----------------------------------------------------------------

    async getPlatformAdmins() {
        return this.masterPrisma.platformAdmin.findMany({
            select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ----------------------------------------------------------------
    // BILLING — INVOICES (from subscriptions)
    // ----------------------------------------------------------------

    async getInvoices(page = 1, limit = 20) {
        const [total, data] = await Promise.all([
            this.masterPrisma.subscription.count(),
            this.masterPrisma.subscription.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: { select: { id: true, name: true, slug: true } },
                    plan: { select: { id: true, name: true, priceLkr: true } },
                },
            }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ----------------------------------------------------------------
    // PLATFORM AUDIT LOGS
    // ----------------------------------------------------------------

    async getAuditLogs(page = 1, limit = 50) {
        // Surface subscription & tenant status changes as a platform audit trail
        // We fetch both and merge them for a chronological feed
        const [subData, tenantData] = await Promise.all([
            this.masterPrisma.subscription.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    tenant: { select: { id: true, name: true } },
                    plan: { select: { name: true } },
                },
            }),
            this.masterPrisma.tenant.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    plan: { select: { name: true } },
                },
            }),
        ]);

        const subLogs = subData.map((s) => ({
            id: s.id,
            action: `SUBSCRIPTION_${s.status}`,
            entityType: 'Subscription',
            tenant: s.tenant,
            performedBy: null,
            ipAddress: null,
            createdAt: s.createdAt,
        }));

        const tenantLogs = tenantData.map((t) => ({
            id: t.id,
            action: `TENANT_PROVISIONED`,
            entityType: 'Tenant',
            tenant: { id: t.id, name: t.name },
            performedBy: null,
            ipAddress: null,
            createdAt: t.createdAt,
        }));

        const allLogs = [...subLogs, ...tenantLogs]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);

        return {
            data: allLogs,
            meta: {
                total: subLogs.length + tenantLogs.length,
                page,
                limit,
                totalPages: Math.ceil((subLogs.length + tenantLogs.length) / limit),
            },
        };
    }

    // ----------------------------------------------------------------
    // GLOBAL SETTINGS
    // ----------------------------------------------------------------

    async getSettings(category?: string) {
        const where = category ? { category } : {};
        return this.masterPrisma.globalSetting.findMany({
            where,
            orderBy: { key: 'asc' },
        });
    }

    async updateSettings(settings: { key: string; value: string; category?: string }[]) {
        const ops = settings.map((s) =>
            this.masterPrisma.globalSetting.upsert({
                where: { key: s.key },
                update: { value: s.value, category: s.category },
                create: { key: s.key, value: s.value, category: s.category },
            }),
        );
        return this.masterPrisma.$transaction(ops);
    }
}
