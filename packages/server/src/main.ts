import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CommonSuccessResponseInterceptor, TransformResponseInterceptor } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  const corsOrigin = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'];

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

  app.useGlobalInterceptors(new CommonSuccessResponseInterceptor());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const config = new DocumentBuilder().setTitle('Seoul Vibe API').setVersion('1.0').build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap();
