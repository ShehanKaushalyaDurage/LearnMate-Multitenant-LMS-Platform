/**
 * LearnHub — Health Check Controller
 *
 * Provides a simple /api endpoint to verify the backend is running.
 * Used by Docker health checks and monitoring.
 */
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'LearnHub API',
      timestamp: new Date().toISOString(),
    };
  }
}
