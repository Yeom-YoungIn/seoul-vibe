import { Module } from '@nestjs/common';
import { AdminContentController } from './admin.controller';
import { AdminContentService } from './admin.service';

@Module({
  controllers: [AdminContentController],
  providers: [AdminContentService],
  exports: [AdminContentService]
})
export class AdminContentModule {}
