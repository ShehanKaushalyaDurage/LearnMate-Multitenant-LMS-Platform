/**
 * LearnHub — Courses Service
 *
 * CRUD operations for courses within a tenant database.
 * All methods receive the tenant PrismaClient via @TenantDb().
 */
import {
    Injectable,
    ConflictException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateCourseDto, UpdateCourseDto, UpdateCourseStatusDto, CourseQueryDto } from './dto/index.js';

const COURSE_SELECT = {
    id: true,
    title: true,
    description: true,
    code: true,
    coverImageUrl: true,
    status: true,
    teacherId: true,
    classLocation: true,
    grade: true,
    teacher: { select: { id: true, firstName: true, lastName: true, subject: true } },
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class CoursesService {
    private readonly logger = new Logger(CoursesService.name);

    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------

    async createCourse(prisma: PrismaClient, dto: CreateCourseDto) {
        // Check code uniqueness
        if (dto.code) {
            const existing = await prisma.course.findUnique({ where: { code: dto.code } });
            if (existing) {
                throw new ConflictException(`Course code "${dto.code}" already exists`);
            }
        }

        const course = await prisma.course.create({
            data: {
                title: dto.title,
                description: dto.description,
                code: dto.code,
                coverImageUrl: dto.coverImageUrl,
                status: dto.status || 'ACTIVE',
                teacherId: dto.teacherId,
                classLocation: dto.classLocation,
                grade: dto.grade,
            },
            select: COURSE_SELECT,
        });

        this.logger.log(`✅ Created course: ${course.title}`);
        return course;
    }

    // ----------------------------------------------------------------
    // LIST (PAGINATED)
    // ----------------------------------------------------------------

    async getCourses(prisma: PrismaClient, query: CourseQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (query.status) {
            where.status = query.status;
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                select: {
                    ...COURSE_SELECT,
                    _count: { select: { batches: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.course.count({ where }),
        ]);

        return {
            data: courses,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ----------------------------------------------------------------
    // GET BY ID
    // ----------------------------------------------------------------

    async getCourseById(prisma: PrismaClient, id: string) {
        const course = await prisma.course.findUnique({
            where: { id },
            select: {
                ...COURSE_SELECT,
                batches: {
                    select: {
                        id: true,
                        name: true,
                        startDate: true,
                        endDate: true,
                        capacity: true,
                        status: true,
                        _count: { select: { enrollments: true, teachers: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: { select: { batches: true, contentItems: true } },
            },
        });

        if (!course) {
            throw new NotFoundException(`Course "${id}" not found`);
        }

        return course;
    }

    // ----------------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------------

    async updateCourse(prisma: PrismaClient, id: string, dto: UpdateCourseDto) {
        const existing = await prisma.course.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Course "${id}" not found`);
        }

        // Check code uniqueness if changing
        if (dto.code && dto.code !== existing.code) {
            const codeTaken = await prisma.course.findUnique({ where: { code: dto.code } });
            if (codeTaken) {
                throw new ConflictException(`Course code "${dto.code}" already in use`);
            }
        }

        const course = await prisma.course.update({
            where: { id },
            data: dto,
            select: COURSE_SELECT,
        });

        this.logger.log(`✏️ Updated course: ${course.title}`);
        return course;
    }

    // ----------------------------------------------------------------
    // UPDATE STATUS
    // ----------------------------------------------------------------

    async updateCourseStatus(prisma: PrismaClient, id: string, dto: UpdateCourseStatusDto) {
        const existing = await prisma.course.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Course "${id}" not found`);
        }

        const course = await prisma.course.update({
            where: { id },
            data: { status: dto.status },
            select: COURSE_SELECT,
        });

        this.logger.log(`🔄 Course ${course.title} status → ${dto.status}`);
        return course;
    }
}
