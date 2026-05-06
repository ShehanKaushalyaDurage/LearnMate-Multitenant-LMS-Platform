/**
 * LearnHub — Create Tenant DTO
 *
 * Validates request body for provisioning a new tenant (institute).
 */
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTenantDto {
    /** Institute name (e.g., "Colombo National Academy") */
    @IsString()
    @MinLength(2)
    @MaxLength(255)
    name: string;

    /**
     * URL-safe slug for subdomain routing: {slug}.learnhub.lk
     * Only lowercase letters, numbers, and hyphens allowed.
     */
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    @Matches(/^[a-z0-9-]+$/, {
        message: 'slug must contain only lowercase letters, numbers, and hyphens',
    })
    slug: string;

    /** Subscription plan ID */
    @IsOptional()
    @IsString()
    planId?: string;

    /** Contact email for the institute */
    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    /** Contact phone number */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    contactPhone?: string;

    /** Physical address of the institute */
    @IsOptional()
    @IsString()
    address?: string;

    /**
     * Admin account credentials for the tenant's first admin user.
     * This admin will be seeded into the tenant's database.
     */
    @IsEmail()
    adminEmail: string;

    @IsString()
    @MinLength(2)
    adminFirstName: string;

    @IsString()
    @MinLength(1)
    adminLastName: string;

    /** Admin password. Must be at least 8 characters. */
    @IsString()
    @MinLength(8)
    adminPassword: string;
}
