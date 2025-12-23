import { Module } from '@nestjs/common';
import { ServiceContentController } from './service.controller';
import { ServiceContentService } from './service.service';

@Module({
  controllers: [ServiceContentController],
  providers: [ServiceContentService],
  exports: [ServiceContentService]
})
export class ServiceContentModule {}
