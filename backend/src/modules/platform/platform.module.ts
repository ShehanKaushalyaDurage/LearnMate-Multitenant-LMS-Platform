import { Module } from '@nestjs/common';
import { PlatformService } from './platform.service.js';
import { PlatformController } from './platform.controller.js';
import { PlatformSettingsController } from './platform-settings.controller.js';
import { TenantsModule } from '../tenants/tenants.module.js';

@Module({
    imports: [TenantsModule],
    controllers: [PlatformController, PlatformSettingsController],
    providers: [PlatformService],
    exports: [PlatformService],
})
export class PlatformModule { }
