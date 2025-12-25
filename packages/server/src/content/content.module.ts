import { Module } from '@nestjs/common';
import { AdminContentModule } from './admin/admin.content.module';
import { ServiceContentModule } from './service/content.module';

@Module({
  imports: [AdminContentModule, ServiceContentModule],
  exports: [AdminContentModule, ServiceContentModule]
})
export class ContentModule {}
