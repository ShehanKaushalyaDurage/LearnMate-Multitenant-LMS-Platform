import { IsString, IsOptional, IsUUID } from 'class-validator';

export class IssueCertificateDto {
    @IsUUID()
    studentId!: string;

    @IsUUID()
    courseId!: string;

    @IsOptional()
    @IsUUID()
    batchId?: string;

    @IsOptional()
    @IsString()
    certificateUrl?: string;
}

export class CertificateQueryDto {
    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsUUID()
    studentId?: string;

    @IsOptional()
    @IsUUID()
    courseId?: string;

    @IsOptional()
    @IsUUID()
    batchId?: string;
}
