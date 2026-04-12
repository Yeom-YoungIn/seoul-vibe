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
