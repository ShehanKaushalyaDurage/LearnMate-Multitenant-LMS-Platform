/**
 * LearnHub — Platform Login DTO
 *
 * Validates platform super admin login requests.
 * Authenticates against the master database's PlatformAdmin table.
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class PlatformLoginDto {
    /** Admin email */
    @IsEmail()
    email!: string;

    /** Admin password */
    @IsString()
    @MinLength(6)
    password!: string;
}
