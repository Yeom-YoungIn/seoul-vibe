import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../shared/entities/post.entity';
import { AdminPostController } from './admin.post.controller';
import { AdminPostService } from './admin.post.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [AdminPostController],
  providers: [AdminPostService],
  exports: [AdminPostService],
})
export class AdminPostModule {}
