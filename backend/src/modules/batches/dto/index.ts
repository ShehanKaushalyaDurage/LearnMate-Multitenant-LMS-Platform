import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsDateString, Min, MinLength, MaxLength } from 'class-validator';

export enum BatchStatusEnum {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export class CreateBatchDto {
    @IsUUID()
    courseId!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name!: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;
}

export class UpdateBatchDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsEnum(BatchStatusEnum)
    status?: BatchStatusEnum;
}

export class BatchQueryDto {
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
    @IsUUID()
    courseId?: string;

    @IsOptional()
    @IsEnum(BatchStatusEnum)
    status?: BatchStatusEnum;
}

export class EnrollStudentDto {
    @IsUUID()
    studentId!: string;
}

export class AssignTeacherDto {
    @IsUUID()
    teacherId!: string;
}
