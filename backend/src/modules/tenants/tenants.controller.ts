/**
 * LearnHub — Tenants Controller
 *
 * API endpoints for managing tenants (institutes) on the platform.
 * These endpoints are intended for Platform Super Admins only.
 */
import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TenantsService } from './tenants.service.js';
import { CreateTenantDto, UpdateTenantStatusDto, TenantQueryDto, UpdateTenantPlanDto, UpdateTenantFeaturesDto } from './dto/index.js';

@Controller('tenants')
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTenant(@Body() dto: CreateTenantDto) {
        return this.tenantsService.provisionTenant(dto);
    }

    @Get()
    async listTenants(@Query() query: TenantQueryDto) {
        return this.tenantsService.getTenants(query);
    }

    @Get(':id')
    async getTenant(@Param('id', ParseUUIDPipe) id: string) {
        return this.tenantsService.getTenantById(id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTenantStatusDto,
    ) {
        return this.tenantsService.updateTenantStatus(id, dto);
    }

    @Patch(':id/plan')
    async updatePlan(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTenantPlanDto,
    ) {
        return this.tenantsService.updateTenantPlan(id, dto.planId);
    }

    @Get(':id/features')
    async getFeatures(@Param('id', ParseUUIDPipe) id: string) {
        return this.tenantsService.getTenantFeatures(id);
    }

    @Patch(':id/features')
    async updateFeatures(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTenantFeaturesDto,
    ) {
        return this.tenantsService.updateTenantFeatures(id, dto);
    }
}
