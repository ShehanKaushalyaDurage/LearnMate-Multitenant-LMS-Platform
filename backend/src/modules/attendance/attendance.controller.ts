/**
 * LearnHub — Attendance Controller
 *
 * Routes under /api/tenant/attendance.
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import {
    CreateSessionDto,
    SessionQueryDto,
    MarkAttendanceDto,
    StudentAttendanceQueryDto,
} from './dto/index.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';
import type { JwtPayload } from '../../common/interfaces/index.js';

@Controller('tenant/attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('sessions')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async createSession(
        @TenantDb() prisma: any,
        @Body() dto: CreateSessionDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.attendanceService.createSession(prisma, dto, user.sub);
    }

    @Get('sessions')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getSessions(@TenantDb() prisma: any, @Query() query: SessionQueryDto) {
        return this.attendanceService.getSessions(prisma, query);
    }

    @Get('sessions/:id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getSession(@TenantDb() prisma: any, @Param('id', ParseUUIDPipe) id: string) {
        return this.attendanceService.getSessionById(prisma, id);
    }

    @Post('sessions/:id/mark')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async markAttendance(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body() dto: MarkAttendanceDto,
    ) {
        return this.attendanceService.markAttendance(prisma, sessionId, dto);
    }

    @Get('students/:id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
    async getStudentAttendance(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) studentId: string,
        @Query() query: StudentAttendanceQueryDto,
    ) {
        return this.attendanceService.getStudentAttendance(prisma, studentId, query);
    }
}
