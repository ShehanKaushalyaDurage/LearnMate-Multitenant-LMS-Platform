import { IsString, IsOptional, IsUUID, IsInt, IsDateString, Min, MinLength, MaxLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
    @IsUUID()
    batchId!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    pdfUrl?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsInt()
    @Min(1)
    maxMarks!: number;
}

export class UpdateAssignmentDto {
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
    pdfUrl?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxMarks?: number;
}

export class AssignmentQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsUUID()
    batchId?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

export class SubmitAssignmentDto {
    @IsOptional()
    @IsString()
    fileUrl?: string;
}

export class GradeSubmissionDto {
    @IsInt()
    @Min(0)
    marks!: number;

    @IsOptional()
    @IsString()
    feedback?: string;
}
