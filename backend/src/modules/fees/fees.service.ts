import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateInvoiceDto, UpdateInvoiceStatusDto, InvoiceQueryDto } from './dto/index.js';

const INVOICE_SELECT = {
    id: true, studentId: true, batchId: true,
    amountLkr: true, dueDate: true, status: true,
    paymentMethod: true, paidAt: true, payherePaymentId: true,
    createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class FeesService {
    private readonly logger = new Logger(FeesService.name);

    async createInvoice(prisma: PrismaClient, dto: CreateInvoiceDto) {
        const [student, batch] = await Promise.all([
            prisma.user.findUnique({ where: { id: dto.studentId } }),
            prisma.batch.findUnique({ where: { id: dto.batchId } }),
        ]);
        if (!student) throw new NotFoundException(`Student "${dto.studentId}" not found`);
        if (!batch) throw new NotFoundException(`Batch "${dto.batchId}" not found`);

        const invoice = await prisma.feeInvoice.create({
            data: {
                studentId: dto.studentId,
                batchId: dto.batchId,
                amountLkr: dto.amountLkr,
                dueDate: new Date(dto.dueDate),
            },
            select: {
                ...INVOICE_SELECT,
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
                batch: { select: { id: true, name: true } },
            },
        });

        this.logger.log(`✅ Created invoice: LKR ${dto.amountLkr} for student ${student.email}`);
        return invoice;
    }

    async getInvoices(prisma: PrismaClient, query: InvoiceQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.studentId) where.studentId = query.studentId;
        if (query.batchId) where.batchId = query.batchId;
        if (query.status) where.status = query.status;

        const [invoices, total] = await Promise.all([
            prisma.feeInvoice.findMany({
                where,
                select: {
                    ...INVOICE_SELECT,
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    batch: { select: { id: true, name: true } },
                },
                skip, take: limit,
                orderBy: { dueDate: 'asc' },
            }),
            prisma.feeInvoice.count({ where }),
        ]);

        return { data: invoices, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async getStudentInvoices(prisma: PrismaClient, studentId: string, query: InvoiceQueryDto) {
        return this.getInvoices(prisma, { ...query, studentId });
    }

    async updatePaymentStatus(prisma: PrismaClient, invoiceId: string, dto: UpdateInvoiceStatusDto) {
        const invoice = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) throw new NotFoundException(`Invoice "${invoiceId}" not found`);

        const updated = await prisma.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                status: dto.status,
                paymentMethod: dto.paymentMethod,
                payherePaymentId: dto.payherePaymentId,
                paidAt: dto.status === 'PAID' ? new Date() : undefined,
            },
            select: INVOICE_SELECT,
        });

        this.logger.log(`💰 Invoice ${invoiceId} → ${dto.status}`);
        return updated;
    }

    async getTotalRevenue(prisma: PrismaClient) {
        const result = await prisma.feeInvoice.aggregate({
            where: { status: 'PAID' },
            _sum: { amountLkr: true },
        });
        return { total: result._sum.amountLkr || 0 };
    }

    /**
     * Get invoices for students in classes assigned to the given teacher.
     * We find batches whose course has teacherId = teacherId, then filter invoices by those batchIds.
     */
    async getTeacherStudentInvoices(prisma: PrismaClient, teacherId: string, query: InvoiceQueryDto) {
        // Find all batches in courses assigned to this teacher
        const batches = await prisma.batch.findMany({
            where: { course: { teacherId } },
            select: { id: true },
        });
        const batchIds = batches.map((b: any) => b.id);

        if (batchIds.length === 0) {
            return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } };
        }

        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { batchId: { in: batchIds } };
        if (query.status) where.status = query.status;

        const [invoices, total] = await Promise.all([
            prisma.feeInvoice.findMany({
                where,
                select: {
                    ...INVOICE_SELECT,
                    student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    batch: { select: { id: true, name: true } },
                },
                skip, take: limit,
                orderBy: { dueDate: 'asc' },
            }),
            prisma.feeInvoice.count({ where }),
        ]);

        return { data: invoices, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }
}
