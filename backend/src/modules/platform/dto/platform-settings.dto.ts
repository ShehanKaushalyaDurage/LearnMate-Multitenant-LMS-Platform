import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGlobalSettingDto {
    @IsString()
    key!: string;

    @IsString()
    value!: string;

    @IsOptional()
    @IsString()
    category?: string;
}

export class BatchUpdateSettingsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateGlobalSettingDto)
    settings!: UpdateGlobalSettingDto[];
}
