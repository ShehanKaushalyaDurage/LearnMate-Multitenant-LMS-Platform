import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsDecimal } from 'class-validator';

export class CreateInvoiceDto {
    @IsUUID()
    studentId!: string;

    @IsUUID()
    batchId!: string;

    @IsDecimal()
    amountLkr!: string;

    @IsDateString()
    dueDate!: string;
}

export enum InvoiceStatusEnum {
    PENDING = 'PENDING',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export class UpdateInvoiceStatusDto {
    @IsEnum(InvoiceStatusEnum)
    status!: InvoiceStatusEnum;

    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @IsOptional()
    @IsString()
    payherePaymentId?: string;
}

export class InvoiceQueryDto {
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
    batchId?: string;

    @IsOptional()
    @IsEnum(InvoiceStatusEnum)
    status?: InvoiceStatusEnum;
}
