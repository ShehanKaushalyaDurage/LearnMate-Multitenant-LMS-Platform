/**
 * LearnHub — Prisma Module
 *
 * Global module providing database access services:
 * - MasterPrismaService: singleton connection to the master (platform) database
 * - TenantPrismaService: factory for per-tenant database connections
 *
 * Marked as @Global() so it can be injected anywhere without re-importing.
 */
import { Global, Module } from '@nestjs/common';
import { MasterPrismaService } from './master-prisma.service.js';
import { TenantPrismaService } from './tenant-prisma.service.js';

@Global()
@Module({
    providers: [MasterPrismaService, TenantPrismaService],
    exports: [MasterPrismaService, TenantPrismaService],
})
export class PrismaModule { }
