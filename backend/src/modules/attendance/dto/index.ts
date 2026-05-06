import { IsString, IsOptional, IsUUID, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionDto {
    @IsUUID()
    batchId!: string;

    @IsDateString()
    date!: string;

    @IsOptional()
    @IsUUID()
    timetableSlotId?: string;
}

export class SessionQueryDto {
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
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;
}

export enum AttendanceStatusEnum {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    EXCUSED = 'EXCUSED',
}

export class AttendanceRecordDto {
    @IsUUID()
    studentId!: string;

    @IsEnum(AttendanceStatusEnum)
    status!: AttendanceStatusEnum;
}

export class MarkAttendanceDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceRecordDto)
    records!: AttendanceRecordDto[];
}

export class StudentAttendanceQueryDto {
    @IsOptional()
    @IsUUID()
    batchId?: string;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;
}
