import { IsString, IsOptional, IsInt, IsIn, Min, Max, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateSlotDto {
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek!: number; // 0=Sunday … 6=Saturday

    @IsString()
    @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
    startTime!: string;

    @IsString()
    @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
    endTime!: string;

    @IsOptional()
    @IsString()
    room?: string;

    @IsOptional()
    @IsString()
    meetLink?: string;
}

export class UpdateSlotDto {
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX, { message: 'startTime must be HH:mm' })
    startTime?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX, { message: 'endTime must be HH:mm' })
    endTime?: string;

    @IsOptional()
    @IsString()
    room?: string;

    @IsOptional()
    @IsString()
    meetLink?: string;
}
