/**
 * LearnHub — Global HTTP Exception Filter
 *
 * Catches all HTTP exceptions and formats them into a consistent
 * API error response shape. Also logs errors for debugging.
 */
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as Record<string, any>;
                message = responseObj.message || exception.message;
                error = responseObj.error || 'Error';
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            // Log unexpected errors with stack trace
            this.logger.error(
                `Unexpected error: ${exception.message}`,
                exception.stack,
            );
        }

        // Log all 5xx errors
        if (status >= 500) {
            this.logger.error(
                `[${request.method}] ${request.url} → ${status}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(status).json({
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
