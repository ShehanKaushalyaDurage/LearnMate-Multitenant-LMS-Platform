import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogQueryDto } from './dto/index.js';
import { TenantDb, Roles } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/audit-logs')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) { }

    /**
     * GET /api/tenant/audit-logs
     *
     * Admin-only immutable audit trail viewer.
     * Supports filtering by entityType, entityId, userId, and date range.
     */
    @Get()
    @Roles(UserRole.ADMIN)
    async getLogs(@TenantDb() prisma: any, @Query() query: AuditLogQueryDto) {
        return this.auditLogService.getLogs(prisma, query);
    }
}
