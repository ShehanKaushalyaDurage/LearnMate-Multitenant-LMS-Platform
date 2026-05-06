import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateAnnouncementDto, AnnouncementQueryDto } from './dto/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Injectable()
export class AnnouncementsService {
    private readonly logger = new Logger(AnnouncementsService.name);

    async createAnnouncement(prisma: PrismaClient, dto: CreateAnnouncementDto, userId: string) {
        // Validate batchId if BATCH target
        if (dto.targetType === 'BATCH' && dto.targetId) {
            const batch = await prisma.batch.findUnique({ where: { id: dto.targetId } });
            if (!batch) throw new NotFoundException(`Batch "${dto.targetId}" not found`);
        }

        const announcement = await prisma.announcement.create({
            data: {
                targetType: dto.targetType,
                targetId: dto.targetId,
                title: dto.title,
                body: dto.body,
                createdBy: userId,
            },
            select: {
                id: true,
                targetType: true,
                targetId: true,
                title: true,
                body: true,
                createdAt: true,
                creator: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        this.logger.log(`📢 Announcement "${dto.title}" posted to ${dto.targetType}`);
        return announcement;
    }

    async getAnnouncements(prisma: PrismaClient, query: AnnouncementQueryDto, user: JwtPayload) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        let where: any = {};

        if (user.role === UserRole.STUDENT) {
            // Students see: ALL, ROLE=STUDENT, or their specific BATCHes
            const enrollments = await prisma.batchEnrollment.findMany({
                where: { studentId: user.sub, status: 'ACTIVE' },
                select: { batchId: true },
            });
            const batchIds = enrollments.map((e) => e.batchId);

            where = {
                OR: [
                    { targetType: 'ALL' },
                    { targetType: 'ROLE', targetId: 'STUDENT' },
                    { targetType: 'BATCH', targetId: { in: batchIds } },
                ],
            };
        } else if (user.role === UserRole.PARENT) {
            // Parents see: ALL, ROLE=PARENT, or their children's specific BATCHes
            const links = await prisma.parentStudentLink.findMany({
                where: { parentId: user.sub },
                select: { studentId: true },
            });
            const studentIds = links.map(l => l.studentId);

            const enrollments = await prisma.batchEnrollment.findMany({
                where: { studentId: { in: studentIds }, status: 'ACTIVE' },
                select: { batchId: true },
            });
            const batchIds = enrollments.map(e => e.batchId);

            where = {
                OR: [
                    { targetType: 'ALL' },
                    { targetType: 'ROLE', targetId: 'PARENT' },
                    { targetType: 'BATCH', targetId: { in: batchIds } },
                ],
            };
        } else if (query.targetType) {
            where.targetType = query.targetType;
        }

        const [announcements, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                select: {
                    id: true,
                    targetType: true,
                    targetId: true,
                    title: true,
                    body: true,
                    createdAt: true,
                    creator: { select: { id: true, firstName: true, lastName: true } },
                    batch: { select: { id: true, name: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.announcement.count({ where }),
        ]);

        return { data: announcements, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async deleteAnnouncement(prisma: PrismaClient, id: string) {
        const existing = await prisma.announcement.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException(`Announcement "${id}" not found`);
        await prisma.announcement.delete({ where: { id } });
        return { message: 'Announcement deleted' };
    }
}
