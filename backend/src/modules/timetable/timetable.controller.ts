import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { TimetableService } from './timetable.service.js';
import { CreateSlotDto, UpdateSlotDto } from './dto/index.js';
import { TenantDb, Roles } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/timetable')
export class TimetableController {
    constructor(private readonly timetableService: TimetableService) { }

    @Post('batches/:batchId/slots')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async create(
        @TenantDb() prisma: any,
        @Param('batchId', ParseUUIDPipe) batchId: string,
        @Body() dto: CreateSlotDto,
    ) {
        return this.timetableService.createSlot(prisma, batchId, dto);
    }

    @Get('batches/:batchId')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
    async getBatchTimetable(
        @TenantDb() prisma: any,
        @Param('batchId', ParseUUIDPipe) batchId: string,
    ) {
        return this.timetableService.getBatchTimetable(prisma, batchId);
    }

    @Patch('slots/:id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) slotId: string,
        @Body() dto: UpdateSlotDto,
    ) {
        return this.timetableService.updateSlot(prisma, slotId, dto);
    }

    @Get('today')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getTodaySchedule(@TenantDb() prisma: any) {
        return this.timetableService.getTodaySchedule(prisma);
    }

    @Delete('slots/:id')
    @Roles(UserRole.ADMIN)
    async remove(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) slotId: string,
    ) {
        return this.timetableService.deleteSlot(prisma, slotId);
    }
}
