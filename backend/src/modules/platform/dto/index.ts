import { IsString, IsOptional, IsUUID, IsDecimal, IsBoolean, IsInt, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// --- Plans ---

export class CreatePlanDto {
    @IsString()
    name!: string;

    @IsInt()
    @Min(1)
    maxStudents!: number;

    @IsInt()
    @Min(1)
    maxTeachers!: number;

    @IsInt()
    @Min(1)
    maxCourses!: number;

    @IsDecimal()
    priceLkr!: string;
}

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxStudents?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxTeachers?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxCourses?: number;

    @IsOptional()
    @IsDecimal()
    priceLkr?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

// --- Subscriptions ---

export enum SubscriptionStatusEnum {
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
    TRIALING = 'TRIALING',
}

export class CreateSubscriptionDto {
    @IsUUID()
    tenantId!: string;

    @IsUUID()
    planId!: string;

    @IsString()
    currentPeriodStart!: string;

    @IsString()
    currentPeriodEnd!: string;

    @IsOptional()
    @IsString()
    payhereSubscriptionId?: string;
}

export class UpdateSubscriptionStatusDto {
    @IsIn(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING'])
    status!: SubscriptionStatusEnum;
}
export * from './platform-settings.dto.js';
