import { SetMetadata, Type } from '@nestjs/common';

export const TransformResponse = (dto: Type<unknown>) => SetMetadata('responseDto', dto);
