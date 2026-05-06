/**
 * LearnHub — Batches Controller
 *
 * Tenant-scoped batch management + enrollment + teacher assignment.
 * All routes under /api/tenant/batches.
 */
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { BatchesService } from './batches.service.js';
import { CreateBatchDto, UpdateBatchDto, BatchQueryDto, EnrollStudentDto, AssignTeacherDto } from './dto/index.js';
import { TenantDb, Roles } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/batches')
export class BatchesController {
    constructor(private readonly batchesService: BatchesService) { }

    // --- BATCH CRUD ---

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@TenantDb() prisma: any, @Body() dto: CreateBatchDto) {
        return this.batchesService.createBatch(prisma, dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findAll(@TenantDb() prisma: any, @Query() query: BatchQueryDto) {
        return this.batchesService.getBatches(prisma, query);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async findOne(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.batchesService.getBatchById(prisma, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateBatchDto,
    ) {
        return this.batchesService.updateBatch(prisma, id, dto);
    }

    // --- STUDENT ENROLLMENT ---

    @Post(':id/enroll')
    @Roles(UserRole.ADMIN)
    async enrollStudent(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) batchId: string,
        @Body() dto: EnrollStudentDto,
    ) {
        return this.batchesService.enrollStudent(prisma, batchId, dto);
    }

    @Delete(':id/enroll/:studentId')
    @Roles(UserRole.ADMIN)
    async removeEnrollment(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) batchId: string,
        @Param('studentId', ParseUUIDPipe) studentId: string,
    ) {
        return this.batchesService.removeEnrollment(prisma, batchId, studentId);
    }

    // --- TEACHER ASSIGNMENT ---

    @Post(':id/teachers')
    @Roles(UserRole.ADMIN)
    async assignTeacher(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) batchId: string,
        @Body() dto: AssignTeacherDto,
    ) {
        return this.batchesService.assignTeacher(prisma, batchId, dto);
    }

    @Delete(':id/teachers/:teacherId')
    @Roles(UserRole.ADMIN)
    async removeTeacher(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) batchId: string,
        @Param('teacherId', ParseUUIDPipe) teacherId: string,
    ) {
        return this.batchesService.removeTeacher(prisma, batchId, teacherId);
    }
}
