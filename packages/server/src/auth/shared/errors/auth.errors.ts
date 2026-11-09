import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';

export class EmailAlreadyExistsError extends ConflictException {
  constructor() {
    super({ errorCode: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' });
  }
}

export class InvalidCredentialsError extends UnauthorizedException {
  constructor() {
    super({ errorCode: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
  }
}

export class EmailNotVerifiedError extends UnauthorizedException {
  constructor() {
    super({ errorCode: 'EMAIL_NOT_VERIFIED', message: 'Email is not verified' });
  }
}

export class InvalidVerifyTokenError extends NotFoundException {
  constructor() {
    super({ errorCode: 'INVALID_VERIFY_TOKEN', message: 'Invalid or expired verification token' });
  }
}

export class InvalidRefreshTokenError extends UnauthorizedException {
  constructor() {
    super({ errorCode: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
  }
}
