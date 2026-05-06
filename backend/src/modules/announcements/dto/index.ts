import { IsString, IsOptional, IsUUID, IsEnum, MinLength, MaxLength } from 'class-validator';

export enum AnnouncementTargetEnum {
    ALL = 'ALL',
    BATCH = 'BATCH',
    ROLE = 'ROLE',
}

export class CreateAnnouncementDto {
    @IsEnum(AnnouncementTargetEnum)
    targetType!: AnnouncementTargetEnum;

    /** Required when targetType is BATCH (batchId) or ROLE (role name) */
    @IsOptional()
    @IsString()
    targetId?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title!: string;

    @IsString()
    @MinLength(1)
    body!: string;
}

export class AnnouncementQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsEnum(AnnouncementTargetEnum)
    targetType?: AnnouncementTargetEnum;
}
