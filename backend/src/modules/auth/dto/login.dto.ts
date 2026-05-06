/**
 * LearnHub — Login DTO
 *
 * Validates tenant user login requests.
 * The slug identifies which tenant database to authenticate against.
 */
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
    /** Tenant slug (from subdomain or explicit body field) */
    @IsOptional()
    @IsString()
    slug?: string;

    /** User email */
    @IsEmail()
    email!: string;

    /** User password */
    @IsString()
    @MinLength(6)
    password!: string;
}
