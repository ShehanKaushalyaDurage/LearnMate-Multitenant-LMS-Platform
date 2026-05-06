/**
 * LearnHub — Create User DTO
 */
import { IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, Matches, IsInt, IsIn, Min, Max } from 'class-validator';

export enum CreateUserRole {
    ADMIN = 'ADMIN',
    TEACHER = 'TEACHER',
    STUDENT = 'STUDENT',
    PARENT = 'PARENT',
}

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName!: string;

    @IsEnum(CreateUserRole)
    role!: CreateUserRole;

    @IsOptional()
    @IsString()
    @Matches(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' })
    phone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    nic?: string;

    // --- Teacher & Student shared field ---
    @IsOptional()
    @IsString()
    @MaxLength(100)
    subject?: string;

    // --- Student-specific fields ---
    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2100)
    birthYear?: number;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    parentName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    parentMobile?: string;

    @IsOptional()
    @IsIn(['O/L', 'A/L', 'Courses'])
    grade?: string;

    @IsOptional()
    @IsIn(['Theory', 'Paper'])
    classType?: string;

    @IsOptional()
    @IsIn(['English Medium', 'Sinhala Medium'])
    medium?: string;

    @IsOptional()
    @IsIn(['Online', 'Physical'])
    classLocation?: string;
}
