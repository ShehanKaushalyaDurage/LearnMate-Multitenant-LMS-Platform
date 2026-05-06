import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class AuditLogQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    /** Filter by entity type e.g. "User", "Course", "Assignment" */
    @IsOptional()
    @IsString()
    entityType?: string;

    /** Filter by a specific entity ID */
    @IsOptional()
    @IsUUID()
    entityId?: string;

    /** Filter by the user who performed the action */
    @IsOptional()
    @IsUUID()
    userId?: string;

    /** ISO date string lower bound (inclusive) */
    @IsOptional()
    @IsDateString()
    from?: string;

    /** ISO date string upper bound (inclusive) */
    @IsOptional()
    @IsDateString()
    to?: string;
}

export interface CreateAuditLogEntry {
    userId?: string;
    action: string;         // e.g. 'CREATE', 'UPDATE', 'DELETE'
    entityType: string;     // e.g. 'User', 'Course'
    entityId: string;
    oldValueJson?: object;
    newValueJson?: object;
    ipAddress?: string;
}
