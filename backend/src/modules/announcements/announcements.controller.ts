import { Controller, Get, Post, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service.js';
import { CreateAnnouncementDto, AnnouncementQueryDto } from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/announcements')
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async create(
        @TenantDb() prisma: any,
        @Body() dto: CreateAnnouncementDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.announcementsService.createAnnouncement(prisma, dto, user.sub);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findAll(
        @TenantDb() prisma: any,
        @Query() query: AnnouncementQueryDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.announcementsService.getAnnouncements(prisma, query, user);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.announcementsService.deleteAnnouncement(prisma, id);
    }
}
