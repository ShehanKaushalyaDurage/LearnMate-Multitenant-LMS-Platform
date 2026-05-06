import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantFeaturesDto {
    @IsOptional()
    @IsBoolean()
    enableExams?: boolean;

    @IsOptional()
    @IsBoolean()
    enableAssignments?: boolean;

    @IsOptional()
    @IsBoolean()
    enableAttendance?: boolean;
}
