/**
 * LearnHub — Attendance Service
 *
 * Session-based attendance: teacher creates a session (batch + date),
 * then bulk-marks each student as PRESENT/ABSENT/LATE/EXCUSED.
 */
import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import type { PrismaClient } from '../../../generated/tenant/client';
import type {
    CreateSessionDto,
    SessionQueryDto,
    MarkAttendanceDto,
    StudentAttendanceQueryDto,
} from './dto/index.js';

@Injectable()
export class AttendanceService {
    private readonly logger = new Logger(AttendanceService.name);

    // ----------------------------------------------------------------
    // CREATE SESSION
    // ----------------------------------------------------------------

    async createSession(prisma: PrismaClient, dto: CreateSessionDto, userId: string) {
        const batch = await prisma.batch.findUnique({ where: { id: dto.batchId } });
        if (!batch) throw new NotFoundException(`Batch "${dto.batchId}" not found`);

        const session = await prisma.attendanceSession.create({
            data: {
                batchId: dto.batchId,
                date: new Date(dto.date),
                timetableSlotId: dto.timetableSlotId,
                createdBy: userId,
            },
            select: {
                id: true,
                date: true,
                createdAt: true,
                batch: { select: { id: true, name: true } },
            },
        });

        this.logger.log(`✅ Created attendance session for ${batch.name} on ${dto.date}`);
        return session;
    }

    // ----------------------------------------------------------------
    // LIST SESSIONS
    // ----------------------------------------------------------------

    async getSessions(prisma: PrismaClient, query: SessionQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (query.batchId) where.batchId = query.batchId;

        if (query.fromDate || query.toDate) {
            const dateFilter: Record<string, Date> = {};
            if (query.fromDate) dateFilter.gte = new Date(query.fromDate);
            if (query.toDate) dateFilter.lte = new Date(query.toDate);
            where.date = dateFilter;
        }

        const [sessions, total] = await Promise.all([
            prisma.attendanceSession.findMany({
                where,
                select: {
                    id: true,
                    date: true,
                    createdAt: true,
                    batch: { select: { id: true, name: true } },
                    creator: { select: { id: true, firstName: true, lastName: true } },
                    _count: { select: { records: true } },
                },
                skip,
                take: limit,
                orderBy: { date: 'desc' },
            }),
            prisma.attendanceSession.count({ where }),
        ]);

        return {
            data: sessions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    // ----------------------------------------------------------------
    // GET SESSION BY ID (with all student records)
    // ----------------------------------------------------------------

    async getSessionById(prisma: PrismaClient, id: string) {
        const session = await prisma.attendanceSession.findUnique({
            where: { id },
            select: {
                id: true,
                date: true,
                createdAt: true,
                batch: { select: { id: true, name: true } },
                creator: { select: { id: true, firstName: true, lastName: true } },
                records: {
                    select: {
                        id: true,
                        status: true,
                        student: { select: { id: true, firstName: true, lastName: true, email: true } },
                    },
                    orderBy: { student: { firstName: 'asc' } },
                },
            },
        });

        if (!session) throw new NotFoundException(`Session "${id}" not found`);
        return session;
    }

    // ----------------------------------------------------------------
    // BULK MARK ATTENDANCE
    // ----------------------------------------------------------------

    async markAttendance(prisma: PrismaClient, sessionId: string, dto: MarkAttendanceDto) {
        const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
        if (!session) throw new NotFoundException(`Session "${sessionId}" not found`);

        // Upsert each record (allows re-marking)
        const results = await Promise.all(
            dto.records.map((record) =>
                prisma.attendanceRecord.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId,
                            studentId: record.studentId,
                        },
                    },
                    create: {
                        sessionId,
                        studentId: record.studentId,
                        status: record.status,
                    },
                    update: {
                        status: record.status,
                    },
                    select: {
                        id: true,
                        status: true,
                        student: { select: { id: true, firstName: true, lastName: true } },
                    },
                }),
            ),
        );

        this.logger.log(`📋 Marked ${results.length} attendance records for session ${sessionId}`);
        return { marked: results.length, records: results };
    }

    // ----------------------------------------------------------------
    // STUDENT ATTENDANCE SUMMARY
    // ----------------------------------------------------------------

    async getStudentAttendance(prisma: PrismaClient, studentId: string, query: StudentAttendanceQueryDto) {
        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student) throw new NotFoundException(`Student "${studentId}" not found`);

        const where: Record<string, unknown> = { studentId };

        if (query.batchId || query.fromDate || query.toDate) {
            const sessionFilter: Record<string, unknown> = {};
            if (query.batchId) sessionFilter.batchId = query.batchId;
            if (query.fromDate || query.toDate) {
                const dateFilter: Record<string, Date> = {};
                if (query.fromDate) dateFilter.gte = new Date(query.fromDate);
                if (query.toDate) dateFilter.lte = new Date(query.toDate);
                sessionFilter.date = dateFilter;
            }
            where.session = sessionFilter;
        }

        const records = await prisma.attendanceRecord.findMany({
            where,
            select: {
                id: true,
                status: true,
                session: {
                    select: {
                        id: true,
                        date: true,
                        batch: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { session: { date: 'desc' } },
        });

        // Compute summary
        const summary = {
            total: records.length,
            present: records.filter((r) => r.status === 'PRESENT').length,
            absent: records.filter((r) => r.status === 'ABSENT').length,
            late: records.filter((r) => r.status === 'LATE').length,
            excused: records.filter((r) => r.status === 'EXCUSED').length,
            percentage: 0,
        };
        if (summary.total > 0) {
            summary.percentage = Math.round(((summary.present + summary.late) / summary.total) * 100);
        }

        return {
            student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
            summary,
            records,
        };
    }
}
