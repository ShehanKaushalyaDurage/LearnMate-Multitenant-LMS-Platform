/**
 * LearnHub — Root Application Module
 *
 * Configures global modules:
 * - ConfigModule: loads .env variables
 * - ThrottlerModule: rate limiting (100 req/min per IP)
 * - PrismaModule: database connections (master + tenant)
 * - AuthModule: JWT authentication + refresh tokens
 *
 * Middleware:
 * - TenantMiddleware: resolves subdomain → tenant DB context for /api/tenant/*
 *
 * Global guards (execution order):
 * 1. ThrottlerGuard  — rate limiting
 * 2. JwtAuthGuard    — JWT validation (respects @Public())
 * 3. RolesGuard      — role-based access (reads @Roles())
 */
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CoursesModule } from './modules/courses/courses.module.js';
import { BatchesModule } from './modules/batches/batches.module.js';
import { AssignmentsModule } from './modules/assignments/assignments.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { ExamsModule } from './modules/exams/exams.module.js';
import { FeesModule } from './modules/fees/fees.module.js';
import { AnnouncementsModule } from './modules/announcements/announcements.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { CertificatesModule } from './modules/certificates/certificates.module.js';
import { TimetableModule } from './modules/timetable/timetable.module.js';
import { ContentModule } from './modules/content/content.module.js';
import { PlatformModule } from './modules/platform/platform.module.js';
import { AuditLogModule } from './modules/audit-log/audit-log.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './modules/auth/guards/roles.guard.js';
import { TenantMiddleware } from './common/middleware/tenant.middleware.js';
import { EncryptionService } from './common/utils/encryption.service.js';

@Module({
  imports: [
    // --- Global Config ---
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../.env'],
    }),

    // --- Rate Limiting: 100 requests per 60 seconds per IP ---
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
            limit: config.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // --- Database ---
    PrismaModule,

    // --- Feature Modules ---
    TenantsModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    BatchesModule,
    AssignmentsModule,
    AttendanceModule,
    ExamsModule,
    FeesModule,
    AnnouncementsModule,
    NotificationsModule,
    CertificatesModule,
    TimetableModule,
    ContentModule,
    PlatformModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    // Middleware dependencies
    EncryptionService,

    // Global guards (order matters: throttle → jwt → roles)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('tenant/*path');
  }
}
