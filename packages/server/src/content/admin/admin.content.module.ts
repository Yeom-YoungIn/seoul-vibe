import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from '../shared/entities/content.entity';
import { ContentTranslation } from '../shared/entities/content-translations.entity';
import { AdminContentController } from './admin.content.controller';
import { AdminContentService } from './admin.content.service';

@Module({
  imports: [TypeOrmModule.forFeature([Content, ContentTranslation])],
  controllers: [AdminContentController],
  providers: [AdminContentService],
  exports: [AdminContentService],
})
export class AdminContentModule {}
