/**
 * LearnHub — Assignments Controller
 *
 * Routes under /api/tenant/assignments.
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
import { AssignmentsService } from './assignments.service.js';
import {
    CreateAssignmentDto,
    UpdateAssignmentDto,
    AssignmentQueryDto,
    SubmitAssignmentDto,
    GradeSubmissionDto,
} from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/assignments')
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) { }

    @Post()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async create(
        @TenantDb() prisma: any,
        @Body() dto: CreateAssignmentDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.assignmentsService.createAssignment(prisma, dto, user.sub);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findAll(@TenantDb() prisma: any, @Query() query: AssignmentQueryDto) {
        return this.assignmentsService.getAssignments(prisma, query);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findOne(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.assignmentsService.getAssignmentById(prisma, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAssignmentDto,
    ) {
        return this.assignmentsService.updateAssignment(prisma, id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async remove(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.assignmentsService.deleteAssignment(prisma, id);
    }

    // --- STUDENT SUBMISSION ---

    @Post(':id/submit')
    @Roles(UserRole.STUDENT)
    async submit(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) assignmentId: string,
        @Body() dto: SubmitAssignmentDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.assignmentsService.submitAssignment(prisma, assignmentId, user.sub, dto);
    }

    // --- TEACHER GRADING ---

    @Patch('submissions/:id/grade')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async grade(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) submissionId: string,
        @Body() dto: GradeSubmissionDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.assignmentsService.gradeSubmission(prisma, submissionId, dto, user.sub);
    }
}
