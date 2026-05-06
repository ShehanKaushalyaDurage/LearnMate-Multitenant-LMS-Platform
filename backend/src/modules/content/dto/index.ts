import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ContentTypeEnum {
    VIDEO = 'VIDEO',
    PDF = 'PDF',
    DOCUMENT = 'DOCUMENT',
    LINK = 'LINK',
}

export class CreateContentItemDto {
    @IsUUID()
    courseId!: string;

    @IsOptional()
    @IsUUID()
    batchId?: string;

    @IsString()
    title!: string;

    @IsEnum(ContentTypeEnum)
    type!: ContentTypeEnum;

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    bunnyVideoId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    orderIndex?: number;

    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;
}

export class UpdateContentItemDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    url?: string;

    @IsOptional()
    @IsString()
    bunnyVideoId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    orderIndex?: number;

    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;
}

export class ContentQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsEnum(ContentTypeEnum)
    type?: ContentTypeEnum;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    visibleOnly?: boolean;
}
