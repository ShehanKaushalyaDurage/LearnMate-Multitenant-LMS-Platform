/**
 * LearnHub — Users Module
 *
 * Encapsulates tenant-scoped user management.
 * Depends on PrismaModule (global) for database access.
 */
import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';

@Module({
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
