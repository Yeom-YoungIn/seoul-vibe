import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../shared/entities/post.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostServicePort } from './post.service.port';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [PostController],
  providers: [
    PostService,
    { provide: PostServicePort, useExisting: PostService },
  ],
  exports: [PostServicePort, PostService],
})
export class ServicePostModule {}
