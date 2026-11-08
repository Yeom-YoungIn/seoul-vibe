import { StorageModule } from '../../upload/storage/storage.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { AdminContentController } from './admin.content.controller';
import { AdminContentService } from './admin.content.service';
import { SourcePreviewService } from './source/source-preview.service';

@Module({
  imports: [StorageModule, TypeOrmModule.forFeature([Content, ContentTranslation])],
  controllers: [AdminContentController],
  providers: [AdminContentService, SourcePreviewService],
  exports: [AdminContentService],
})
export class AdminContentModule {}
