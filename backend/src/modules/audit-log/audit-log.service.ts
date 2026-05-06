/**
 * LearnHub — Audit Log Service
 *
 * Immutable audit trail for sensitive operations.
 * Two public methods:
 *  - log()     : write an entry (called by other services)
 *  - getLogs() : paginated read-only query for admins
 */
import { Injectable, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { AuditLogQueryDto, CreateAuditLogEntry } from './dto/index.js';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    /**
     * Write an audit log entry — fire-and-forget safe.
     * Errors are caught and logged rather than thrown, so audit failures
     * never break the parent operation.
     */
    async log(prisma: PrismaClient, entry: CreateAuditLogEntry): Promise<void> {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: entry.userId,
                    action: entry.action,
                    entityType: entry.entityType,
                    entityId: entry.entityId,
                    oldValueJson: entry.oldValueJson as any,
                    newValueJson: entry.newValueJson as any,
                    ipAddress: entry.ipAddress,
                },
            });
        } catch (err) {
            this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
        }
    }

    /**
     * Paginated query for admins — supports filter by entityType, entityId,
     * userId, and date range (from/to).
     */
    async getLogs(prisma: PrismaClient, query: AuditLogQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (query.entityType) where.entityType = query.entityType;
        if (query.entityId) where.entityId = query.entityId;
        if (query.userId) where.userId = query.userId;

        if (query.from || query.to) {
            const createdAt: Record<string, Date> = {};
            if (query.from) createdAt.gte = new Date(query.from);
            if (query.to) createdAt.lte = new Date(query.to);
            where.createdAt = createdAt;
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    action: true,
                    entityType: true,
                    entityId: true,
                    oldValueJson: true,
                    newValueJson: true,
                    ipAddress: true,
                    createdAt: true,
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return {
            data: logs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
