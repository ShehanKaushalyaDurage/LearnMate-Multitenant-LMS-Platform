import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ContentService } from './content.service.js';
import { CreateContentItemDto, UpdateContentItemDto, ContentQueryDto } from './dto/index.js';
import { TenantDb, Roles } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/content')
export class ContentController {
    constructor(private readonly contentService: ContentService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async create(@TenantDb() prisma: any, @Body() dto: CreateContentItemDto) {
        return this.contentService.createItem(prisma, dto);
    }

    @Get('courses/:courseId')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async getCourseContent(
        @TenantDb() prisma: any,
        @Param('courseId', ParseUUIDPipe) courseId: string,
        @Query() query: ContentQueryDto,
    ) {
        return this.contentService.getCourseContent(prisma, courseId, query);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) itemId: string,
        @Body() dto: UpdateContentItemDto,
    ) {
        return this.contentService.updateItem(prisma, itemId, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async remove(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) itemId: string) {
        return this.contentService.deleteItem(prisma, itemId);
    }
}
