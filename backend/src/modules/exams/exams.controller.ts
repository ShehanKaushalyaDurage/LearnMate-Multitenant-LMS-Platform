/**
 * LearnHub — Exams Controller
 *
 * Routes under /api/tenant/exams.
 * 12 endpoints covering exam lifecycle, questions, attempts, and results.
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
    ForbiddenException,
} from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import {
    CreateExamDto,
    UpdateExamDto,
    UpdateExamStatusDto,
    ExamQueryDto,
    CreateQuestionDto,
    UpdateQuestionDto,
    SubmitAttemptDto,
    ManualResultDto,
} from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/exams')
export class ExamsController {
    constructor(private readonly examsService: ExamsService) { }

    // --- EXAM CRUD ---

    @Post()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async create(@TenantDb() prisma: any, @Body() dto: CreateExamDto) {
        return this.examsService.createExam(prisma, dto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findAll(@TenantDb() prisma: any, @Query() query: ExamQueryDto) {
        return this.examsService.getExams(prisma, query);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async findOne(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.examsService.getExamById(prisma, id);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async update(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateExamDto,
    ) {
        return this.examsService.updateExam(prisma, id, dto);
    }

    @Patch(':id/status')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async updateStatus(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateExamStatusDto,
    ) {
        return this.examsService.updateExamStatus(prisma, id, dto);
    }

    // --- MCQ QUESTIONS ---

    @Post(':id/questions')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async addQuestion(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) examId: string,
        @Body() dto: CreateQuestionDto,
    ) {
        return this.examsService.addQuestion(prisma, examId, dto);
    }

    @Patch('questions/:id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async updateQuestion(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) questionId: string,
        @Body() dto: UpdateQuestionDto,
    ) {
        return this.examsService.updateQuestion(prisma, questionId, dto);
    }

    @Delete('questions/:id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async deleteQuestion(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) questionId: string,
    ) {
        return this.examsService.deleteQuestion(prisma, questionId);
    }

    // --- STUDENT ATTEMPTS ---

    @Post(':id/start')
    @Roles(UserRole.STUDENT)
    async startAttempt(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) examId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.examsService.startAttempt(prisma, examId, user.sub);
    }

    @Post('attempts/:id/submit')
    @Roles(UserRole.STUDENT)
    async submitAttempt(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) attemptId: string,
        @Body() dto: SubmitAttemptDto,
    ) {
        return this.examsService.submitAttempt(prisma, attemptId, dto);
    }

    // --- RESULTS ---

    @Post(':id/results')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async enterManualResult(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) examId: string,
        @Body() dto: ManualResultDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.examsService.enterManualResult(prisma, examId, dto, user.sub);
    }

    @Get(':id/results')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getResults(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) examId: string,
    ) {
        return this.examsService.getExamResults(prisma, examId);
    }

    @Get('student/:studentId/results')
    @Roles(UserRole.PARENT)
    async getStudentResults(
        @TenantDb() prisma: any,
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @CurrentUser('sub') parentId: string,
    ) {
        // Security: Verify student is linked to this parent
        const link = await prisma.parentStudentLink.findFirst({
            where: { studentId, parentId },
        });
        if (!link) throw new ForbiddenException('You are not authorized to view results for this student');

        return this.examsService.getStudentResults(prisma, studentId);
    }
}
