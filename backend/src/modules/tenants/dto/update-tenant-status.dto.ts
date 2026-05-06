/**
 * LearnHub — Update Tenant Status DTO
 */
import { IsEnum } from 'class-validator';

export enum TenantStatusValue {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DEACTIVATED = 'DEACTIVATED',
}

export class UpdateTenantStatusDto {
    @IsEnum(TenantStatusValue)
    status: TenantStatusValue;
}
