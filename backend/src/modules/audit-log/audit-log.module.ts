import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogController } from './audit-log.controller.js';

@Module({
    controllers: [AuditLogController],
    providers: [AuditLogService],
    exports: [AuditLogService], // Export so other modules can inject and call log()
})
export class AuditLogModule { }
