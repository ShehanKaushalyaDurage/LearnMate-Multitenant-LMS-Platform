/**
 * LearnHub — Update User DTO
 *
 * Validates partial user profile updates.
 * All fields are optional — only provided fields are updated.
 */
import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
    /** Updated first name */
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    /** Updated last name */
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;

    /** Updated email */
    @IsOptional()
    @IsEmail()
    email?: string;

    /** Updated phone */
    @IsOptional()
    @IsString()
    @Matches(/^[0-9+\-\s()]+$/, { message: 'Invalid phone number format' })
    phone?: string;

    /** Updated NIC */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    nic?: string;

    /** New password (if changing) */
    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(100)
    password?: string;
}
