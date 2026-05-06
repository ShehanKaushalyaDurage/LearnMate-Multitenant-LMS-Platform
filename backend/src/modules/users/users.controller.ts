/**
 * LearnHub — Users Controller
 *
 * Tenant-scoped user management endpoints.
 * All routes are under /api/tenant/users and require tenant middleware.
 *
 * The tenant PrismaClient is injected via @TenantDb() decorator,
 * which reads req.tenantPrisma set by TenantMiddleware.
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
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UserQueryDto } from './dto/user-query.dto.js';
import { TenantDb, Roles, CurrentUser } from '../../common/decorators/index.js';
import { UserRole } from '../../common/constants/index.js';

@Controller('tenant/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ----------------------------------------------------------------
    // CREATE USER — Admin only
    // ----------------------------------------------------------------

    @Post()
    @Roles(UserRole.ADMIN)
    async createUser(
        @TenantDb() prisma: any,
        @Body() dto: CreateUserDto,
    ) {
        return this.usersService.createUser(prisma, dto);
    }

    // ----------------------------------------------------------------
    // LIST USERS — Admin + Teacher
    // ----------------------------------------------------------------

    @Get()
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getUsers(
        @TenantDb() prisma: any,
        @Query() query: UserQueryDto,
    ) {
        return this.usersService.getUsers(prisma, query);
    }

    // ----------------------------------------------------------------
    // GET USER BY ID
    // ----------------------------------------------------------------

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getUserById(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.getUserById(prisma, id);
    }

    // ----------------------------------------------------------------
    // UPDATE USER
    // ----------------------------------------------------------------

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    async updateUser(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.updateUser(prisma, id, dto);
    }

    // ----------------------------------------------------------------
    // UPDATE USER STATUS — Admin only
    // ----------------------------------------------------------------

    @Patch(':id/status')
    @Roles(UserRole.ADMIN)
    async updateUserStatus(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserStatusDto,
    ) {
        return this.usersService.updateUserStatus(prisma, id, dto);
    }

    // ----------------------------------------------------------------
    // PARENT-STUDENT LINKS — Admin only
    // ----------------------------------------------------------------

    @Post(':id/parents/:parentId')
    @Roles(UserRole.ADMIN)
    async linkParent(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) studentId: string,
        @Param('parentId', ParseUUIDPipe) parentId: string,
    ) {
        return this.usersService.linkParent(prisma, studentId, parentId);
    }

    @Delete(':id/parents/:parentId')
    @Roles(UserRole.ADMIN)
    async unlinkParent(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) studentId: string,
        @Param('parentId', ParseUUIDPipe) parentId: string,
    ) {
        return this.usersService.unlinkParent(prisma, studentId, parentId);
    }

    @Get(':id/parents')
    @Roles(UserRole.ADMIN, UserRole.TEACHER)
    async getStudentParents(
        @TenantDb() prisma: any,
        @Param('id', ParseUUIDPipe) studentId: string,
    ) {
        return this.usersService.getStudentParents(prisma, studentId);
    }

    // ----------------------------------------------------------------
    // PARENT: MY CHILDREN
    // ----------------------------------------------------------------

    @Get('my-children')
    @Roles(UserRole.PARENT)
    async getMyChildren(
        @TenantDb() prisma: any,
        @CurrentUser('sub') parentId: string,
    ) {
        return this.usersService.getMyChildren(prisma, parentId);
    }

    // ----------------------------------------------------------------
    // QR CODE SEARCH — Admin can search students by ID or name
    // ----------------------------------------------------------------

    @Get('search-qr')
    @Roles(UserRole.ADMIN)
    async searchStudentQr(
        @TenantDb() prisma: any,
        @Query('q') query: string,
    ) {
        return this.usersService.searchStudentQr(prisma, query || '');
    }

    // ----------------------------------------------------------------
    // TEACHERS LIST — for subject-teacher mapping in student registration
    // ----------------------------------------------------------------

    @Get('teachers-list')
    @Roles(UserRole.ADMIN)
    async getTeachers(@TenantDb() prisma: any) {
        return this.usersService.getTeachers(prisma);
    }
}
