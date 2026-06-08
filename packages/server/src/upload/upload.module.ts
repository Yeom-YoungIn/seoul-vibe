import { Module } from '@nestjs/common';
import { ServiceUploadModule } from './service/upload.module';

@Module({
  imports: [ServiceUploadModule],
  exports: [ServiceUploadModule],
})
export class UploadModule {}
