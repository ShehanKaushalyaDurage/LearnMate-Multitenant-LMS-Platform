import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateContentItemDto, UpdateContentItemDto, ContentQueryDto } from './dto/index.js';

const CONTENT_SELECT = {
    id: true,
    courseId: true,
    batchId: true,
    title: true,
    type: true,
    url: true,
    bunnyVideoId: true,
    orderIndex: true,
    isVisible: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class ContentService {
    private readonly logger = new Logger(ContentService.name);

    async createItem(prisma: PrismaClient, dto: CreateContentItemDto) {
        const course = await prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) throw new NotFoundException(`Course "${dto.courseId}" not found`);

        const item = await prisma.contentItem.create({
            data: {
                courseId: dto.courseId,
                batchId: dto.batchId,
                title: dto.title,
                type: dto.type,
                url: dto.url,
                bunnyVideoId: dto.bunnyVideoId,
                orderIndex: dto.orderIndex ?? 0,
                isVisible: dto.isVisible ?? true,
            },
            select: {
                ...CONTENT_SELECT,
                course: { select: { id: true, title: true } },
            },
        });

        this.logger.log(`📚 Added ${dto.type} content: "${dto.title}" to course ${course.title}`);
        return item;
    }

    async getCourseContent(prisma: PrismaClient, courseId: string, query: ContentQueryDto) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) throw new NotFoundException(`Course "${courseId}" not found`);

        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '50', 10), 200);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { courseId };
        if (query.type) where.type = query.type;
        if (query.visibleOnly) where.isVisible = true;

        const [items, total] = await Promise.all([
            prisma.contentItem.findMany({
                where,
                select: CONTENT_SELECT,
                skip, take: limit,
                orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
            }),
            prisma.contentItem.count({ where }),
        ]);

        return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async updateItem(prisma: PrismaClient, itemId: string, dto: UpdateContentItemDto) {
        const item = await prisma.contentItem.findUnique({ where: { id: itemId } });
        if (!item) throw new NotFoundException(`Content item "${itemId}" not found`);

        return prisma.contentItem.update({
            where: { id: itemId },
            data: dto,
            select: CONTENT_SELECT,
        });
    }

    async deleteItem(prisma: PrismaClient, itemId: string) {
        const item = await prisma.contentItem.findUnique({ where: { id: itemId } });
        if (!item) throw new NotFoundException(`Content item "${itemId}" not found`);
        await prisma.contentItem.delete({ where: { id: itemId } });
        return { message: 'Content item deleted' };
    }
}
