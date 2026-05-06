import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import { PlatformService } from './platform.service.js';
import { BatchUpdateSettingsDto } from './dto/index.js';

@Controller('platform/settings')
export class PlatformSettingsController {
    constructor(private readonly platformService: PlatformService) { }

    @Get()
    async getSettings(@Query('category') category?: string) {
        return this.platformService.getSettings(category);
    }

    @Patch()
    async updateSettings(@Body() dto: BatchUpdateSettingsDto) {
        return this.platformService.updateSettings(dto.settings);
    }
}
