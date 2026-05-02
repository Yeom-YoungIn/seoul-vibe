import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode?: number;
  errorCode?: string;
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = this.getExceptionResponse(exception);
    const message = exceptionResponse.message ?? this.getDefaultMessage(statusCode);

    const body = {
      success: false,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      statusCode,
      errorCode: exceptionResponse.errorCode ?? exceptionResponse.error ?? this.getDefaultErrorCode(statusCode),
      message,
    };

    this.logException(exception, request, statusCode, message);
    response.status(statusCode).json(body);
  }

  private getExceptionResponse(exception: unknown): ErrorResponseBody {
    if (!(exception instanceof HttpException)) {
      return {};
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response };
    }

    return response as ErrorResponseBody;
  }

  private getDefaultMessage(statusCode: number): string {
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

    return 'Request failed';
  }

  private getDefaultErrorCode(statusCode: number): string {
    return statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_FAILED';
  }

  private logException(
    exception: unknown,
    request: Request,
    statusCode: number,
    message: string | string[],
  ) {
    const logMessage = `${request.method} ${request.originalUrl} ${statusCode} - ${
      Array.isArray(message) ? message.join(', ') : message
    }`;

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(logMessage, stack);
      return;
    }

    this.logger.warn(logMessage);
  }
}
