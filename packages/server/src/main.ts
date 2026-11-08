/**
 * 목적 - EKS/프록시 환경에서 백엔드 부팅, 정적 업로드 노출, Swagger, CORS, health probe 동작을 안정화하기 위해 수정됨
 * 설명 - trust proxy 설정과 uploads 정적 경로, 전역 파이프/필터/인터셉터, Swagger, 포트 및 CORS 초기화를 한 곳에서 수행한다.
 */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './upload/uploads-root';
import {
  AllExceptionsFilter,
  CommonSuccessResponseInterceptor,
  RequestLoggingInterceptor,
  TransformResponseInterceptor,
} from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  const port = process.env.PORT || 3000;
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'];

  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads' });

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalInterceptors(new CommonSuccessResponseInterceptor());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const config = new DocumentBuilder().setTitle('Seoul Vibe API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
