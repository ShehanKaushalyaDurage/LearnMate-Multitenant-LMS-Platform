/**
 * LearnHub — Tenants Module
 *
 * Provides tenant management and provisioning capabilities.
 * TenantMigrationsService replaces the execSync/Prisma CLI approach —
 * migrations are applied directly via pg with no runtime tooling required.
 */
import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service.js';
import { TenantsController } from './tenants.controller.js';
import { TenantMigrationsService } from './tenant-migrations.service.js';
import { EncryptionService } from '../../common/utils/encryption.service.js';

@Module({
    controllers: [TenantsController],
    providers: [TenantsService, TenantMigrationsService, EncryptionService],
    exports: [TenantsService, EncryptionService],
})
export class TenantsModule { }