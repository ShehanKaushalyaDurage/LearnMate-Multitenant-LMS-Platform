import {
    IsString, IsOptional, IsUUID, IsInt, IsEnum, IsDateString,
    IsArray, ValidateNested, Min, MinLength, MaxLength, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// ----------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------

export enum ExamTypeEnum {
    ONLINE_MCQ = 'ONLINE_MCQ',
    MANUAL = 'MANUAL',
}

export enum ExamStatusEnum {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}

// ----------------------------------------------------------------
// EXAM CRUD
// ----------------------------------------------------------------

export class CreateExamDto {
    @IsUUID()
    batchId!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title!: string;

    @IsEnum(ExamTypeEnum)
    type!: ExamTypeEnum;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    durationMinutes?: number;

    @IsInt()
    @Min(1)
    maxMarks!: number;
}

export class UpdateExamDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsDateString()
    date?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    durationMinutes?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    maxMarks?: number;
}

export class UpdateExamStatusDto {
    @IsEnum(ExamStatusEnum)
    status!: ExamStatusEnum;
}

export class ExamQueryDto {
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
    @IsEnum(ExamTypeEnum)
    type?: ExamTypeEnum;

    @IsOptional()
    @IsEnum(ExamStatusEnum)
    status?: ExamStatusEnum;
}

// ----------------------------------------------------------------
// MCQ QUESTIONS
// ----------------------------------------------------------------

export class CreateQuestionDto {
    @IsString()
    questionText!: string;

    @IsString()
    optionA!: string;

    @IsString()
    optionB!: string;

    @IsString()
    optionC!: string;

    @IsString()
    optionD!: string;

    @IsString()
    @Matches(/^[ABCD]$/, { message: 'correctOption must be A, B, C, or D' })
    correctOption!: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    marks?: number;
}

export class UpdateQuestionDto {
    @IsOptional()
    @IsString()
    questionText?: string;

    @IsOptional()
    @IsString()
    optionA?: string;

    @IsOptional()
    @IsString()
    optionB?: string;

    @IsOptional()
    @IsString()
    optionC?: string;

    @IsOptional()
    @IsString()
    optionD?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[ABCD]$/, { message: 'correctOption must be A, B, C, or D' })
    correctOption?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    marks?: number;
}

// ----------------------------------------------------------------
// STUDENT ATTEMPTS (ONLINE MCQ)
// ----------------------------------------------------------------

export class ExamAnswerDto {
    @IsUUID()
    questionId!: string;

    @IsString()
    @Matches(/^[ABCD]$/, { message: 'selectedOption must be A, B, C, or D' })
    selectedOption!: string;
}

export class SubmitAttemptDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExamAnswerDto)
    answers!: ExamAnswerDto[];
}

// ----------------------------------------------------------------
// MANUAL RESULTS
// ----------------------------------------------------------------

export class ManualResultDto {
    @IsUUID()
    studentId!: string;

    @IsInt()
    @Min(0)
    marksObtained!: number;

    @IsOptional()
    @IsString()
    remarks?: string;
}
