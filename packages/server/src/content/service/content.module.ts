import { Module } from '@nestjs/common';
import { ServiceContentController } from './content.controller';
import { ServiceContentService } from './content.service';
import { ContentServicePort } from './content.service.port';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentTranslation])],
  controllers: [ServiceContentController],
  providers: [
    ServiceContentService,
    {
      provide: ContentServicePort,
      useExisting: ServiceContentService,
    },
  ],
  exports: [ContentServicePort, ServiceContentService],
})
export class ServiceContentModule {}
