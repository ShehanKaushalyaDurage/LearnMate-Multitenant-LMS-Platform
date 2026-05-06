import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateSlotDto, UpdateSlotDto } from './dto/index.js';

const SLOT_SELECT = {
    id: true,
    batchId: true,
    dayOfWeek: true,
    startTime: true,
    endTime: true,
    room: true,
    meetLink: true,
} as const;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class TimetableService {
    private readonly logger = new Logger(TimetableService.name);

    async createSlot(prisma: PrismaClient, batchId: string, dto: CreateSlotDto) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch) throw new NotFoundException(`Batch "${batchId}" not found`);

        const slot = await prisma.timetableSlot.create({
            data: { batchId, ...dto },
            select: SLOT_SELECT,
        });

        this.logger.log(`📅 Added ${DAY_NAMES[dto.dayOfWeek]} ${dto.startTime}-${dto.endTime} slot to batch ${batch.name}`);
        return slot;
    }

    async getBatchTimetable(prisma: PrismaClient, batchId: string) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch) throw new NotFoundException(`Batch "${batchId}" not found`);

        const slots = await prisma.timetableSlot.findMany({
            where: { batchId },
            select: SLOT_SELECT,
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });

        // Group by day for a convenient weekly view
        const weekly: Record<number, typeof slots> = {};
        for (const slot of slots) {
            if (!weekly[slot.dayOfWeek]) weekly[slot.dayOfWeek] = [];
            weekly[slot.dayOfWeek].push(slot);
        }

        return {
            batch: { id: batch.id, name: batch.name },
            slots,
            weekly,
        };
    }

    async updateSlot(prisma: PrismaClient, slotId: string, dto: UpdateSlotDto) {
        const slot = await prisma.timetableSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException(`Timetable slot "${slotId}" not found`);

        return prisma.timetableSlot.update({
            where: { id: slotId },
            data: dto,
            select: SLOT_SELECT,
        });
    }

    async deleteSlot(prisma: PrismaClient, slotId: string) {
        const slot = await prisma.timetableSlot.findUnique({ where: { id: slotId } });
        if (!slot) throw new NotFoundException(`Timetable slot "${slotId}" not found`);
        await prisma.timetableSlot.delete({ where: { id: slotId } });
        return { message: 'Slot deleted' };
    }

    async getTodaySchedule(prisma: PrismaClient) {
        const today = new Date().getDay();
        return prisma.timetableSlot.findMany({
            where: { dayOfWeek: today },
            select: {
                ...SLOT_SELECT,
                batch: { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
        });
    }
}

