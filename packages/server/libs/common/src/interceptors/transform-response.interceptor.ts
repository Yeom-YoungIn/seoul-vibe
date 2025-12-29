import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor<unknown, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        const handler = context.getHandler();
        const ResponseDto = Reflect.getMetadata('responseDto', handler);

        if (Array.isArray(data) && data.length === 2 && Array.isArray(data[0])) {
          const [entities, count] = data;

          const responseObj = {
            count,
            list: entities,
          };

          return plainToInstance(ResponseDto, responseObj, {
            excludeExtraneousValues: true,
          });
        }

        if (ResponseDto) {
          return plainToInstance(ResponseDto, data, {
            excludeExtraneousValues: true,
          });
        }

        return data;
      })
    );
  }
}
