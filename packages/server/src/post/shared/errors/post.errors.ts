import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class PostNotFoundError extends NotFoundException {
  constructor() {
    super({ errorCode: 'POST_NOT_FOUND', message: 'Post not found' });
  }
}

export class PostForbiddenError extends ForbiddenException {
  constructor() {
    super({ errorCode: 'POST_FORBIDDEN', message: 'You do not have permission to modify this post' });
  }
}
