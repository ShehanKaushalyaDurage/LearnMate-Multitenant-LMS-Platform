/**
 * LearnHub — Update User Status DTO
 */
import { IsEnum } from 'class-validator';

export enum UserStatusUpdate {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

export class UpdateUserStatusDto {
    @IsEnum(UserStatusUpdate)
    status!: UserStatusUpdate;
}
