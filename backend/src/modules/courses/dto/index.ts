import { IsString, IsOptional, IsEnum, IsUUID, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

export enum CourseStatusEnum {
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
    DRAFT = 'DRAFT',
}

export class CreateCourseDto {
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'Code may only contain letters, numbers, hyphens, and underscores' })
    code?: string;

    @IsOptional()
    @IsString()
    coverImageUrl?: string;

    @IsOptional()
    @IsEnum(CourseStatusEnum)
    status?: CourseStatusEnum;

    @IsOptional()
    @IsUUID()
    teacherId?: string;

    @IsOptional()
    @IsIn(['Online', 'Physical'])
    classLocation?: string;

    @IsOptional()
    @IsIn(['O/L', 'A/L', 'Courses'])
    grade?: string;
}

export class UpdateCourseDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'Code may only contain letters, numbers, hyphens, and underscores' })
    code?: string;

    @IsOptional()
    @IsString()
    coverImageUrl?: string;

    @IsOptional()
    @IsUUID()
    teacherId?: string;

    @IsOptional()
    @IsIn(['Online', 'Physical'])
    classLocation?: string;

    @IsOptional()
    @IsIn(['O/L', 'A/L', 'Courses'])
    grade?: string;
}

export class UpdateCourseStatusDto {
    @IsEnum(CourseStatusEnum)
    status!: CourseStatusEnum;
}

export class CourseQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(CourseStatusEnum)
    status?: CourseStatusEnum;
}
