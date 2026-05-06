import { Controller, Get, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { NotificationQueryDto } from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findAll(
        @TenantDb() prisma: any,
        @Query() query: NotificationQueryDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.notificationsService.getUserNotifications(prisma, user.sub, query);
    }

    @Patch(':id/read')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async markRead(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.notificationsService.markAsRead(prisma, id, user.sub);
    }

    @Patch('read-all')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async markAllRead(@TenantDb() prisma: any, @CurrentUser() user: JwtPayload) {
        return this.notificationsService.markAllAsRead(prisma, user.sub);
    }
}
