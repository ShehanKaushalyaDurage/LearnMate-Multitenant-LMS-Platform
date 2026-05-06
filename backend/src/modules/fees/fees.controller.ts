import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FeesService } from './fees.service.js';
import { CreateInvoiceDto, UpdateInvoiceStatusDto, InvoiceQueryDto, InvoiceStatusEnum } from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/fees')
export class FeesController {
    constructor(private readonly feesService: FeesService) { }

    @Post('invoices')
    @Roles(UserRole.ADMIN)
    async create(@TenantDb() prisma: any, @Body() dto: CreateInvoiceDto) {
        return this.feesService.createInvoice(prisma, dto);
    }

    @Get('invoices')
    @Roles(UserRole.ADMIN)
    async findAll(@TenantDb() prisma: any, @Query() query: InvoiceQueryDto) {
        return this.feesService.getInvoices(prisma, query);
    }

    /** Student views their own invoices */
    @Get('my-invoices')
    @Roles(UserRole.STUDENT)
    async myInvoices(
        @TenantDb() prisma: any,
        @Query() query: InvoiceQueryDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.feesService.getStudentInvoices(prisma, user.sub, query);
    }

    @Patch('invoices/:id/status')
    @Roles(UserRole.ADMIN)
    async updateStatus(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateInvoiceStatusDto,
    ) {
        return this.feesService.updatePaymentStatus(prisma, id, dto);
    }

    /** Mock payment simulation for Area 5 */
    @Post('invoices/:id/simulate-payment')
    @Roles(UserRole.STUDENT)
    async simulatePayment(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        const invoice = await prisma.feeInvoice.findUnique({ where: { id } });
        if (!invoice) throw new NotFoundException('Invoice not found');
        if (invoice.studentId !== user.sub) throw new ForbiddenException('Not authorized to pay this invoice');

        return this.feesService.updatePaymentStatus(prisma, id, {
            status: InvoiceStatusEnum.PAID,
            paymentMethod: 'Simulated Card',
            payherePaymentId: `SIM-${Date.now()}`,
        });
    }

    @Get('stats/total-revenue')
    @Roles(UserRole.ADMIN)
    async getRevenue(@TenantDb() prisma: any) {
        return this.feesService.getTotalRevenue(prisma);
    }

    /** Teacher views invoices for students in their classes */
    @Get('teacher-invoices')
    @Roles(UserRole.TEACHER)
    async teacherInvoices(
        @TenantDb() prisma: any,
        @CurrentUser() user: JwtPayload,
        @Query() query: InvoiceQueryDto,
    ) {
        return this.feesService.getTeacherStudentInvoices(prisma, user.sub, query);
    }
}
