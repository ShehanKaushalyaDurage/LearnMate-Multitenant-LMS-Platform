/**
 * LearnHub — Courses Controller
 *
 * Tenant-scoped course management endpoints under /api/tenant/courses.
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { CoursesService } from './courses.service.js';
import { CreateCourseDto, UpdateCourseDto, UpdateCourseStatusDto, CourseQueryDto } from './dto/index.js';
import { TenantDb, Roles } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@TenantDb() prisma: any, @Body() dto: CreateCourseDto) {
        return this.coursesService.createCourse(prisma, dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findAll(@TenantDb() prisma: any, @Query() query: CourseQueryDto) {
        return this.coursesService.getCourses(prisma, query);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findOne(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.coursesService.getCourseById(prisma, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCourseDto,
    ) {
        return this.coursesService.updateCourse(prisma, id, dto);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN)
    async updateStatus(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCourseStatusDto,
    ) {
        return this.coursesService.updateCourseStatus(prisma, id, dto);
    }
}
