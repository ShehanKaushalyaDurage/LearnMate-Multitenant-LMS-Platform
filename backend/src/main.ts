/**
 * LearnHub — NestJS Application Bootstrap
 *
 * Configures:
 * - Global validation pipe (class-validator DTOs)
 * - Global exception filter (consistent error shape)
 * - Global transform interceptor (consistent success shape)
 * - CORS restricted to *.learnhub.lk in production
 * - Cookie parser for httpOnly refresh tokens
 * - Helmet for security headers
 * - Global prefix /api for all routes
 * - Swagger docs at /api/docs (development only)
 */
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const domain = configService.get<string>('APP_DOMAIN', 'learnhub.lk');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // --- Global API prefix ---
  app.setGlobalPrefix('api');

  // --- Security: Helmet ---
  // Disabled in dev so Swagger UI loads correctly
  if (nodeEnv === 'production') {
    app.use(helmet());
  }

  // --- Cookie parser (refresh tokens in httpOnly cookies) ---
  app.use(cookieParser());

  // --- CORS: Allow only *.learnhub.lk in production ---
  app.enableCors({
    origin:
      nodeEnv === 'production'
        ? new RegExp(`^https?://([a-zA-Z0-9-]+\\.)?${domain!.replace('.', '\\.')}$`)
        : true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tenant-slug'],
  });

  // --- Global Exception Filter (consistent error envelope) ---
  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- Global Transform Interceptor (consistent success envelope) ---
  app.useGlobalInterceptors(new TransformInterceptor());

  // --- Global Validation Pipe ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true,            // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Swagger / OpenAPI (development only) ---
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LearnHub LMS API')
      .setDescription(
        'Multi-tenant Learning Management System API for the Sri Lankan education market. ' +
        'All tenant-scoped routes require the X-Tenant-Slug header.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addServer(`http://localhost:${port}`, 'Local development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📖 Swagger docs → http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 LearnHub API running on port ${port} [${nodeEnv}]`);
  logger.log(`📡 CORS: ${nodeEnv === 'production' ? `*.${domain}` : 'all origins (dev)'}`);
}

bootstrap();
