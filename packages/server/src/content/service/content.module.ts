import { Module } from '@nestjs/common';
import { ServiceContentController } from './content.controller';
import { ServiceContentService } from './content.service';

@Module({
  controllers: [ServiceContentController],
  providers: [ServiceContentService],
  exports: [ServiceContentService]
})
export class ServiceContentModule {}
