/**
 * LearnHub — Batches Service
 *
 * CRUD for batches + student enrollment + teacher assignment.
 * All methods receive the tenant PrismaClient via @TenantDb().
 */
import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateBatchDto, UpdateBatchDto, BatchQueryDto, EnrollStudentDto, AssignTeacherDto } from './dto/index.js';

const BATCH_SELECT = {
    id: true,
    courseId: true,
    name: true,
    startDate: true,
    endDate: true,
    capacity: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class BatchesService {
    private readonly logger = new Logger(BatchesService.name);

    // ----------------------------------------------------------------
    // CREATE BATCH
    // ----------------------------------------------------------------

    async createBatch(prisma: PrismaClient, dto: CreateBatchDto) {
        // Verify course exists
        const course = await prisma.course.findUnique({ where: { id: dto.courseId } });
        if (!course) {
            throw new NotFoundException(`Course "${dto.courseId}" not found`);
        }

        const batch = await prisma.batch.create({
            data: {
                courseId: dto.courseId,
                name: dto.name,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                capacity: dto.capacity,
            },
            select: { ...BATCH_SELECT, course: { select: { id: true, title: true } } },
        });

        this.logger.log(`✅ Created batch: ${batch.name} (${course.title})`);
        return batch;
    }

    // ----------------------------------------------------------------
    // LIST BATCHES (PAGINATED)
    // ----------------------------------------------------------------

    async getBatches(prisma: PrismaClient, query: BatchQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (query.courseId) where.courseId = query.courseId;
        if (query.status) where.status = query.status;
        if (query.search) {
            where.name = { contains: query.search, mode: 'insensitive' };
        }

        const [batches, total] = await Promise.all([
            prisma.batch.findMany({
                where,
                select: {
                    ...BATCH_SELECT,
                    course: { select: { id: true, title: true } },
                    _count: { select: { enrollments: true, teachers: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.batch.count({ where }),
        ]);

        return {
            data: batches,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ----------------------------------------------------------------
    // GET BATCH BY ID (with enrolled students + teachers)
    // ----------------------------------------------------------------

    async getBatchById(prisma: PrismaClient, id: string) {
        const batch = await prisma.batch.findUnique({
            where: { id },
            select: {
                ...BATCH_SELECT,
                course: { select: { id: true, title: true, code: true } },
                enrollments: {
                    select: {
                        id: true,
                        enrolledAt: true,
                        status: true,
                        feeStatus: true,
                        student: {
                            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                        },
                    },
                    orderBy: { enrolledAt: 'desc' },
                },
                teachers: {
                    select: {
                        id: true,
                        assignedAt: true,
                        teacher: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
                _count: { select: { enrollments: true, teachers: true } },
            },
        });

        if (!batch) {
            throw new NotFoundException(`Batch "${id}" not found`);
        }

        return batch;
    }

    // ----------------------------------------------------------------
    // UPDATE BATCH
    // ----------------------------------------------------------------

    async updateBatch(prisma: PrismaClient, id: string, dto: UpdateBatchDto) {
        const existing = await prisma.batch.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Batch "${id}" not found`);
        }

        const data: Record<string, unknown> = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
        if (dto.capacity !== undefined) data.capacity = dto.capacity;
        if (dto.status !== undefined) data.status = dto.status;

        const batch = await prisma.batch.update({
            where: { id },
            data,
            select: BATCH_SELECT,
        });

        this.logger.log(`✏️ Updated batch: ${batch.name}`);
        return batch;
    }

    // ----------------------------------------------------------------
    // ENROLL STUDENT
    // ----------------------------------------------------------------

    async enrollStudent(prisma: PrismaClient, batchId: string, dto: EnrollStudentDto) {
        // Verify batch exists
        const batch = await prisma.batch.findUnique({
            where: { id: batchId },
            select: { id: true, capacity: true, _count: { select: { enrollments: true } } },
        });
        if (!batch) {
            throw new NotFoundException(`Batch "${batchId}" not found`);
        }

        // Capacity check
        if (batch.capacity && batch._count.enrollments >= batch.capacity) {
            throw new BadRequestException(`Batch is full (capacity: ${batch.capacity})`);
        }

        // Verify student exists and has STUDENT role
        const student = await prisma.user.findUnique({ where: { id: dto.studentId } });
        if (!student) {
            throw new NotFoundException(`Student "${dto.studentId}" not found`);
        }
        if (student.role !== 'STUDENT') {
            throw new BadRequestException(`User "${dto.studentId}" is not a student`);
        }

        // Check duplicate enrollment
        const existing = await prisma.batchEnrollment.findUnique({
            where: { batchId_studentId: { batchId, studentId: dto.studentId } },
        });
        if (existing) {
            throw new ConflictException('Student is already enrolled in this batch');
        }

        const enrollment = await prisma.batchEnrollment.create({
            data: { batchId, studentId: dto.studentId },
            select: {
                id: true,
                enrolledAt: true,
                status: true,
                feeStatus: true,
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        this.logger.log(`✅ Enrolled student ${student.email} in batch ${batchId}`);
        return enrollment;
    }

    // ----------------------------------------------------------------
    // REMOVE ENROLLMENT
    // ----------------------------------------------------------------

    async removeEnrollment(prisma: PrismaClient, batchId: string, studentId: string) {
        const enrollment = await prisma.batchEnrollment.findUnique({
            where: { batchId_studentId: { batchId, studentId } },
        });
        if (!enrollment) {
            throw new NotFoundException('Enrollment not found');
        }

        await prisma.batchEnrollment.delete({
            where: { batchId_studentId: { batchId, studentId } },
        });

        this.logger.log(`🗑️ Removed enrollment: student ${studentId} from batch ${batchId}`);
        return { message: 'Student unenrolled successfully' };
    }

    // ----------------------------------------------------------------
    // ASSIGN TEACHER
    // ----------------------------------------------------------------

    async assignTeacher(prisma: PrismaClient, batchId: string, dto: AssignTeacherDto) {
        const batch = await prisma.batch.findUnique({ where: { id: batchId } });
        if (!batch) {
            throw new NotFoundException(`Batch "${batchId}" not found`);
        }

        // Verify teacher exists and has TEACHER role
        const teacher = await prisma.user.findUnique({ where: { id: dto.teacherId } });
        if (!teacher) {
            throw new NotFoundException(`Teacher "${dto.teacherId}" not found`);
        }
        if (teacher.role !== 'TEACHER') {
            throw new BadRequestException(`User "${dto.teacherId}" is not a teacher`);
        }

        // Check duplicate assignment
        const existing = await prisma.batchTeacher.findUnique({
            where: { batchId_teacherId: { batchId, teacherId: dto.teacherId } },
        });
        if (existing) {
            throw new ConflictException('Teacher is already assigned to this batch');
        }

        const assignment = await prisma.batchTeacher.create({
            data: { batchId, teacherId: dto.teacherId },
            select: {
                id: true,
                assignedAt: true,
                teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        this.logger.log(`✅ Assigned teacher ${teacher.email} to batch ${batchId}`);
        return assignment;
    }

    // ----------------------------------------------------------------
    // REMOVE TEACHER
    // ----------------------------------------------------------------

    async removeTeacher(prisma: PrismaClient, batchId: string, teacherId: string) {
        const assignment = await prisma.batchTeacher.findUnique({
            where: { batchId_teacherId: { batchId, teacherId } },
        });
        if (!assignment) {
            throw new NotFoundException('Teacher assignment not found');
        }

        await prisma.batchTeacher.delete({
            where: { batchId_teacherId: { batchId, teacherId } },
        });

        this.logger.log(`🗑️ Removed teacher ${teacherId} from batch ${batchId}`);
        return { message: 'Teacher removed from batch successfully' };
    }
}
