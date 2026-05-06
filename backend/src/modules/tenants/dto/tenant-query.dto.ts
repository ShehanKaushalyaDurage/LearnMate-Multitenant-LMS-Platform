/**
 * LearnHub — Tenant Query DTO
 * Validates query parameters for listing tenants.
 */
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class TenantQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(['ACTIVE', 'SUSPENDED', 'PENDING', 'DEACTIVATED'])
    status?: string;
}
