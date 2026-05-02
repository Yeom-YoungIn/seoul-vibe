import { Module } from '@nestjs/common';
import { AdminUserModule } from './admin/admin.user.module';

@Module({
  imports: [AdminUserModule],
  exports: [AdminUserModule],
})
export class UserModule {}
