import { Module } from '@nestjs/common';
import { AuthModule as ServiceAuthModule } from './service/auth.module';

@Module({
  imports: [ServiceAuthModule],
  exports: [ServiceAuthModule],
})
export class AuthModule {}
