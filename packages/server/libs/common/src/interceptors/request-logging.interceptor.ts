import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor<unknown, unknown> {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const { method, originalUrl } = request;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startedAt;
        this.logger.log(`${method} ${originalUrl} ${response.statusCode} - ${duration}ms`);
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startedAt;
        const status = this.getErrorStatus(error);
        this.logger.warn(`${method} ${originalUrl} ${status} - ${duration}ms`);
        return throwError(() => error);
      }),
    );
  }

  private getErrorStatus(error: unknown): number {
    if (
      typeof error === 'object' &&
      error !== null &&
      'getStatus' in error &&
      typeof error.getStatus === 'function'
    ) {
      return error.getStatus();
    }

    return 500;
  }
}
