/**
 * LearnHub — Assignments Service
 *
 * Assignment lifecycle: create → students submit → teachers grade.
 * All methods receive the tenant PrismaClient via @TenantDb().
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type {
    CreateAssignmentDto,
    UpdateAssignmentDto,
    AssignmentQueryDto,
    SubmitAssignmentDto,
    GradeSubmissionDto,
} from './dto/index.js';

const ASSIGNMENT_SELECT = {
    id: true,
    batchId: true,
    title: true,
    description: true,
    pdfUrl: true,
    dueDate: true,
    maxMarks: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class AssignmentsService {
    private readonly logger = new Logger(AssignmentsService.name);

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------

    async createAssignment(prisma: PrismaClient, dto: CreateAssignmentDto, userId: string) {
        const batch = await prisma.batch.findUnique({ where: { id: dto.batchId } });
        if (!batch) throw new NotFoundException(`Batch "${dto.batchId}" not found`);

        const assignment = await prisma.assignment.create({
            data: {
                batchId: dto.batchId,
                title: dto.title,
                description: dto.description,
                pdfUrl: dto.pdfUrl,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                maxMarks: dto.maxMarks,
                createdBy: userId,
            },
            select: {
                ...ASSIGNMENT_SELECT,
                batch: { select: { id: true, name: true, course: { select: { id: true, title: true } } } },
            },
        });

        this.logger.log(`✅ Created assignment: ${assignment.title}`);
        return assignment;
    }

    // ----------------------------------------------------------------
    // LIST
    // ----------------------------------------------------------------

    async getAssignments(prisma: PrismaClient, query: AssignmentQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.batchId) where.batchId = query.batchId;
        if (query.search) {
            where.title = { contains: query.search, mode: 'insensitive' };
        }

        const [assignments, total] = await Promise.all([
            prisma.assignment.findMany({
                where,
                select: {
                    ...ASSIGNMENT_SELECT,
                    batch: { select: { id: true, name: true } },
                    _count: { select: { submissions: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.assignment.count({ where }),
        ]);

        return {
            data: assignments,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ----------------------------------------------------------------
    // GET BY ID
    // ----------------------------------------------------------------

    async getAssignmentById(prisma: PrismaClient, id: string) {
        const assignment = await prisma.assignment.findUnique({
            where: { id },
            select: {
                ...ASSIGNMENT_SELECT,
                batch: { select: { id: true, name: true, course: { select: { id: true, title: true } } } },
                creator: { select: { id: true, firstName: true, lastName: true } },
                submissions: {
                    select: {
                        id: true,
                        submittedAt: true,
                        marks: true,
                        feedback: true,
                        fileUrl: true,
                        student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    },
                    orderBy: { submittedAt: 'desc' },
                },
                _count: { select: { submissions: true } },
            },
        });

        if (!assignment) throw new NotFoundException(`Assignment "${id}" not found`);
        return assignment;
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------

    async updateAssignment(prisma: PrismaClient, id: string, dto: UpdateAssignmentDto) {
        const existing = await prisma.assignment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException(`Assignment "${id}" not found`);

        const data: Record<string, unknown> = {};
        if (dto.title !== undefined) data.title = dto.title;
        if (dto.description !== undefined) data.description = dto.description;
        if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
        if (dto.maxMarks !== undefined) data.maxMarks = dto.maxMarks;

        return prisma.assignment.update({
            where: { id },
            data,
            select: ASSIGNMENT_SELECT,
        });
    }

    // ----------------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------------

    async deleteAssignment(prisma: PrismaClient, id: string) {
        const existing = await prisma.assignment.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException(`Assignment "${id}" not found`);

        await prisma.assignment.delete({ where: { id } });
        this.logger.log(`🗑️ Deleted assignment: ${existing.title}`);
        return { message: 'Assignment deleted' };
    }

    // ----------------------------------------------------------------
    // STUDENT SUBMIT
    // ----------------------------------------------------------------

    async submitAssignment(prisma: PrismaClient, assignmentId: string, studentId: string, dto: SubmitAssignmentDto) {
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) throw new NotFoundException(`Assignment "${assignmentId}" not found`);

        // Check duplicate
        const existing = await prisma.submission.findUnique({
            where: { assignmentId_studentId: { assignmentId, studentId } },
        });
        if (existing) throw new ConflictException('You have already submitted this assignment');

        // Check due date
        if (assignment.dueDate && new Date() > assignment.dueDate) {
            throw new BadRequestException('Submission deadline has passed');
        }

        const submission = await prisma.submission.create({
            data: {
                assignmentId,
                studentId,
                fileUrl: dto.fileUrl,
            },
            select: {
                id: true,
                submittedAt: true,
                fileUrl: true,
                student: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        this.logger.log(`✅ Student ${studentId} submitted assignment ${assignmentId}`);
        return submission;
    }

    // ----------------------------------------------------------------
    // GRADE SUBMISSION
    // ----------------------------------------------------------------

    async gradeSubmission(prisma: PrismaClient, submissionId: string, dto: GradeSubmissionDto, graderId: string) {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: { assignment: { select: { maxMarks: true } } },
        });
        if (!submission) throw new NotFoundException(`Submission "${submissionId}" not found`);

        if (dto.marks > submission.assignment.maxMarks) {
            throw new BadRequestException(`Marks cannot exceed ${submission.assignment.maxMarks}`);
        }

        const graded = await prisma.submission.update({
            where: { id: submissionId },
            data: {
                marks: dto.marks,
                feedback: dto.feedback,
                gradedBy: graderId,
            },
            select: {
                id: true,
                marks: true,
                feedback: true,
                submittedAt: true,
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
                grader: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        this.logger.log(`📝 Graded submission ${submissionId}: ${dto.marks}/${submission.assignment.maxMarks}`);
        return graded;
    }
}
