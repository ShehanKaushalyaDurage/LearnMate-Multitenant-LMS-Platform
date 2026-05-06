import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { NotificationQueryDto } from './dto/index.js';

const NOTIF_SELECT = {
    id: true, type: true, title: true, body: true, isRead: true, createdAt: true,
} as const;

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    async getUserNotifications(prisma: PrismaClient, userId: string, query: NotificationQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = { userId };
        if (query.unreadOnly) where.isRead = false;

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where, select: NOTIF_SELECT,
                skip, take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
        ]);

        const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

        return { data: notifications, meta: { total, page, limit, totalPages: Math.ceil(total / limit), unreadCount } };
    }

    async markAsRead(prisma: PrismaClient, notificationId: string, userId: string) {
        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
        if (!notification) throw new NotFoundException(`Notification "${notificationId}" not found`);
        if (notification.userId !== userId) throw new ForbiddenException('You cannot access this notification');

        return prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
            select: NOTIF_SELECT,
        });
    }

    async markAllAsRead(prisma: PrismaClient, userId: string) {
        const { count } = await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        this.logger.log(`✅ Marked ${count} notifications as read for user ${userId}`);
        return { marked: count };
    }

    /** Internal method: called by other services to push a notification to a user */
    async createNotification(
        prisma: PrismaClient,
        userId: string,
        type: string,
        title: string,
        body: string,
    ) {
        return prisma.notification.create({
            data: { userId, type, title, body },
        });
    }
}
