import { Module } from '@nestjs/common';
import { ServiceContentController } from './content.controller';
import { ServiceContentService } from './content.service';
import { ContentServicePort } from './content.service.port';

@Module({
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
