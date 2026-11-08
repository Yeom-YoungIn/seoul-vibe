import { HttpException, HttpStatus } from '@nestjs/common';

export class ContentNotFoundError extends HttpException {
  constructor(message?: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: 'CONTENT_NOT_FOUND',
        message: message ? message : `content not found`,
      },
      HttpStatus.NOT_FOUND
    );
  }
}

export class InvalidSourceUrlError extends HttpException {
  constructor(message?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'INVALID_SOURCE_URL',
        message: message ? message : `invalid source url`,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class BlockedSourceHostError extends HttpException {
  constructor(message?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        errorCode: 'BLOCKED_SOURCE_HOST',
        message: message ? message : `source host is not allowed`,
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
