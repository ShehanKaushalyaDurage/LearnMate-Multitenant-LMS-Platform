import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { PlatformService } from './platform.service.js';
import { TenantsService } from '../tenants/tenants.service.js';
import {
    CreatePlanDto, UpdatePlanDto,
    CreateSubscriptionDto, UpdateSubscriptionStatusDto,
} from './dto/index.js';
import {
    CreateTenantDto,
    UpdateTenantStatusDto as TenantUpdateDto,
    UpdateTenantPlanDto,
    UpdateTenantFeaturesDto,
} from '../tenants/dto/index.js';
import { Public } from '../../common/decorators/index.js';

@Controller('platform')
export class PlatformController {
    constructor(
        private readonly platformService: PlatformService,
        private readonly tenantsService: TenantsService,
    ) { }

    // --- Stats ---
    @Get('stats')
    @Public()
    async getStats() {
        return this.platformService.getPlatformStats();
    }

    // --- Plans ---
    @Get('plans')
    async getPlans() {
        return this.platformService.getPlans();
    }

    @Get('plans/:id')
    async getPlan(@Param('id', ParseUUIDPipe) id: string) {
        return this.platformService.getPlanById(id);
    }

    @Post('plans')
    async createPlan(@Body() dto: CreatePlanDto) {
        return this.platformService.createPlan(dto);
    }

    @Patch('plans/:id')
    async updatePlan(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePlanDto,
    ) {
        return this.platformService.updatePlan(id, dto);
    }

    // --- Subscriptions ---
    @Get('tenants/:tenantId/subscriptions')
    async getTenantSubscriptions(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
        return this.platformService.getTenantSubscriptions(tenantId);
    }

    @Post('subscriptions')
    async createSubscription(@Body() dto: CreateSubscriptionDto) {
        return this.platformService.createSubscription(dto);
    }

    @Patch('subscriptions/:id/status')
    async updateSubscriptionStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSubscriptionStatusDto,
    ) {
        return this.platformService.updateSubscriptionStatus(id, dto);
    }

    // --- Tenants (super-admin portal) ---
    @Get('tenants')
    async getTenants(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('search') search?: string,
        @Query('status') status?: string,
    ) {
        return this.tenantsService.getTenants({ page: +page, limit: +limit, search, status });
    }

    @Post('tenants')
    async createTenant(@Body() dto: CreateTenantDto) {
        return this.tenantsService.provisionTenant(dto);
    }

    @Patch('tenants/:id')
    async updateTenantStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: TenantUpdateDto,
    ) {
        return this.tenantsService.updateTenantStatus(id, dto);
    }

    @Patch('tenants/:id/plan')
    async updateTenantPlan(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTenantPlanDto,
    ) {
        return this.tenantsService.updateTenantPlan(id, dto.planId);
    }

    @Get('tenants/:id/features')
    async getTenantFeatures(@Param('id', ParseUUIDPipe) id: string) {
        return this.tenantsService.getTenantFeatures(id);
    }

    @Patch('tenants/:id/features')
    async updateTenantFeatures(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTenantFeaturesDto,
    ) {
        return this.tenantsService.updateTenantFeatures(id, dto);
    }

    // --- Platform Admins ---
    @Get('admins')
    async getPlatformAdmins() {
        return this.platformService.getPlatformAdmins();
    }

    // --- Platform Users (Super Admins + Admins only) ---
    @Get('users')
    async getPlatformUsers(
        @Query('search') search?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 50,
    ) {
        return this.platformService.getPlatformAdmins();
    }

    // --- Billing / Invoices ---
    @Get('billing/invoices')
    async getInvoices(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.platformService.getInvoices(+page, +limit);
    }

    // --- Platform Audit Logs ---
    @Get('audit-logs')
    async getAuditLogs(
        @Query('page') page = 1,
        @Query('limit') limit = 50,
    ) {
        return this.platformService.getAuditLogs(+page, +limit);
    }
}
