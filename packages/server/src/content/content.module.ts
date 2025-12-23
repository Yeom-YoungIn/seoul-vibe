import { Module } from '@nestjs/common';
import { AdminContentModule } from './admin/admin.module';
import { ServiceContentModule } from './service/service.module';

@Module({
  imports: [AdminContentModule, ServiceContentModule],
  exports: [AdminContentModule, ServiceContentModule]
})
export class ContentModule {}
