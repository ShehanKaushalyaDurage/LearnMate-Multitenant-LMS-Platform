/**
 * LearnHub — User Query DTO
 *
 * Query parameters for paginated user listing with filters.
 */
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';

export class UserQueryDto {
    /** Page number (default: 1) */
    @IsOptional()
    @IsNumberString()
    page?: string;

    /** Items per page (default: 20) */
    @IsOptional()
    @IsNumberString()
    limit?: string;

    /** Search by name or email */
    @IsOptional()
    @IsString()
    search?: string;

    /** Filter by role */
    @IsOptional()
    @IsEnum({ ADMIN: 'ADMIN', TEACHER: 'TEACHER', STUDENT: 'STUDENT', PARENT: 'PARENT' })
    role?: string;

    /** Filter by status */
    @IsOptional()
    @IsEnum({ ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE', SUSPENDED: 'SUSPENDED' })
    status?: string;
}
