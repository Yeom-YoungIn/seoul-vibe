import { Module } from '@nestjs/common';
import { AdminPostModule } from './admin/admin.post.module';
import { ServicePostModule } from './service/post.module';

@Module({
  imports: [AdminPostModule, ServicePostModule],
  exports: [AdminPostModule, ServicePostModule],
})
export class PostModule {}
