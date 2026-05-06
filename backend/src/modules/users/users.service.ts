import {
    Injectable,
    ConflictException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import type { PrismaClient } from '../../../generated/tenant/client';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import type { UserQueryDto } from './dto/user-query.dto.js';

/** Fields to select for user list responses (excludes sensitive data) */
const USER_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    nic: true,
    role: true,
    status: true,
    avatarUrl: true,
    uniqueId: true,
    qrCode: true,
    subject: true,
    birthYear: true,
    parentName: true,
    parentMobile: true,
    grade: true,
    classType: true,
    medium: true,
    classLocation: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    // ----------------------------------------------------------------
    // CREATE USER
    // ----------------------------------------------------------------

    /**
     * Create a new user within the tenant's database.
     * Hashes the password before storing.
     */
    async createUser(prisma: PrismaClient, dto: CreateUserDto) {
        // Check for duplicate email
        const existing = await prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException(`User with email "${dto.email}" already exists`);
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Generate unique ID and QR code for students
        let uniqueId: string | undefined;
        let qrCode: string | undefined;
        if (dto.role === 'STUDENT') {
            uniqueId = `STU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            try {
                qrCode = await QRCode.toDataURL(uniqueId, { width: 300, margin: 2 });
            } catch {
                this.logger.warn(`Failed to generate QR code for ${uniqueId}`);
            }
        }

        const user = await prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role,
                phone: dto.phone,
                nic: dto.nic,
                subject: dto.subject,
                uniqueId,
                qrCode,
                birthYear: dto.birthYear,
                parentName: dto.parentName,
                parentMobile: dto.parentMobile,
                grade: dto.grade,
                classType: dto.classType,
                medium: dto.medium,
                classLocation: dto.classLocation,
            },
            select: USER_SELECT,
        });

        this.logger.log(`✅ Created user: ${user.email} (${user.role})`);
        return user;
    }

    // ----------------------------------------------------------------
    // LIST USERS (PAGINATED)
    // ----------------------------------------------------------------

    /**
     * Get paginated list of users with optional filters.
     */
    async getUsers(prisma: PrismaClient, query: UserQueryDto) {
        const page = parseInt(query.page || '1', 10);
        const limit = Math.min(parseInt(query.limit || '20', 10), 100);
        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: Record<string, unknown> = {};

        if (query.role) {
            where.role = query.role;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.search) {
            where.OR = [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: USER_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ----------------------------------------------------------------
    // GET USER BY ID
    // ----------------------------------------------------------------

    /**
     * Get a single user by ID.
     */
    async getUserById(prisma: PrismaClient, id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                ...USER_SELECT,
                batchEnrollments: {
                    select: {
                        id: true,
                        status: true,
                        enrolledAt: true,
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                course: { select: { id: true, title: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        return user;
    }

    // ----------------------------------------------------------------
    // UPDATE USER
    // ----------------------------------------------------------------

    /**
     * Update user profile fields. If password is included, hash it first.
     */
    async updateUser(prisma: PrismaClient, id: string, dto: UpdateUserDto) {
        // Verify user exists
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        // Check email uniqueness if changing email
        if (dto.email && dto.email !== existing.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (emailTaken) {
                throw new ConflictException(`Email "${dto.email}" is already in use`);
            }
        }

        // Build update data
        const updateData: Record<string, unknown> = {};
        if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
        if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.nic !== undefined) updateData.nic = dto.nic;
        if (dto.password) {
            updateData.passwordHash = await bcrypt.hash(dto.password, 12);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: USER_SELECT,
        });

        this.logger.log(`✏️ Updated user: ${user.email}`);
        return user;
    }

    // ----------------------------------------------------------------
    // UPDATE USER STATUS
    // ----------------------------------------------------------------

    /**
     * Change a user's account status (activate, suspend, deactivate).
     */
    async updateUserStatus(prisma: PrismaClient, id: string, dto: UpdateUserStatusDto) {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`User with ID "${id}" not found`);
        }

        const user = await prisma.user.update({
            where: { id },
            data: { status: dto.status },
            select: USER_SELECT,
        });

        this.logger.log(`🔄 User ${user.email} status → ${dto.status}`);
        return user;
    }

    // ----------------------------------------------------------------
    // PARENT-STUDENT LINKS
    // ----------------------------------------------------------------

    async linkParent(prisma: PrismaClient, studentId: string, parentId: string) {
        const [student, parent] = await Promise.all([
            prisma.user.findUnique({ where: { id: studentId } }),
            prisma.user.findUnique({ where: { id: parentId } }),
        ]);
        if (!student) throw new NotFoundException(`Student "${studentId}" not found`);
        if (!parent) throw new NotFoundException(`Parent "${parentId}" not found`);
        if (student.role !== 'STUDENT') throw new ConflictException(`User "${studentId}" is not a student`);
        if (parent.role !== 'PARENT') throw new ConflictException(`User "${parentId}" is not a parent`);

        return prisma.parentStudentLink.create({
            data: { parentId, studentId },
            select: {
                id: true,
                parent: { select: { id: true, firstName: true, lastName: true, email: true } },
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async unlinkParent(prisma: PrismaClient, studentId: string, parentId: string) {
        const link = await prisma.parentStudentLink.findUnique({
            where: { parentId_studentId: { parentId, studentId } },
        });
        if (!link) throw new NotFoundException('Parent-student link not found');
        await prisma.parentStudentLink.delete({ where: { id: link.id } });
        return { message: 'Link removed' };
    }

    async getStudentParents(prisma: PrismaClient, studentId: string) {
        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student) throw new NotFoundException(`Student "${studentId}" not found`);

        const links = await prisma.parentStudentLink.findMany({
            where: { studentId },
            select: {
                id: true,
                parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
        });
        return links.map((l) => l.parent);
    }

    // ----------------------------------------------------------------
    // PARENT: GET MY CHILDREN
    // ----------------------------------------------------------------

    /**
     * Returns the list of students linked to the authenticated parent.
     * Useful for the parent portal's Children page and dashboard stats.
     */
    async getMyChildren(prisma: PrismaClient, parentId: string) {
        const links = await prisma.parentStudentLink.findMany({
            where: { parentId },
            select: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                        batchEnrollments: {
                            where: { batch: { status: 'ACTIVE' } },
                            take: 1,
                            select: {
                                batch: {
                                    select: {
                                        id: true,
                                        name: true,
                                        course: { select: { title: true } },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const data = links.map((l: any) => ({
            ...l.student,
            batch: l.student.batchEnrollments[0]?.batch ?? null,
        }));

        return {
            data,
            meta: { total: data.length },
        };
    }

    // ----------------------------------------------------------------
    // QR CODE SEARCH (Admin)
    // ----------------------------------------------------------------

    async searchStudentQr(prisma: PrismaClient, query: string) {
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                OR: [
                    { uniqueId: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                uniqueId: true,
                qrCode: true,
                firstName: true,
                lastName: true,
                email: true,
            },
            take: 20,
        });

        return { data: students };
    }

    // ----------------------------------------------------------------
    // TEACHERS BY SUBJECT (for student registration subject-teacher map)
    // ----------------------------------------------------------------

    async getTeachers(prisma: PrismaClient) {
        const teachers = await prisma.user.findMany({
            where: { role: 'TEACHER', status: 'ACTIVE' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                subject: true,
            },
            orderBy: { firstName: 'asc' },
        });

        return { data: teachers };
    }
}


