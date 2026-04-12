import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, TransformResponse } from '@app/common';
import { CreatePostDto } from './dto/request/create-post.dto';
import { GetPostFeedDto } from './dto/request/get-post-feed.dto';
import { UpdatePostDto } from './dto/request/update-post.dto';
import { PostFeedResponseDto, PostResponseDto } from './dto/response/post.response.dto';
import { PostServicePort } from './post.service.port';

@ApiTags('posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostServicePort) {}

  @Get()
  @TransformResponse(PostFeedResponseDto)
  @ApiOperation({ summary: '피드 목록 조회' })
  getFeed(@Query() query: GetPostFeedDto) {
    return this.postService.getFeed({
      category: query.category,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get(':id')
  @TransformResponse(PostResponseDto)
  @ApiOperation({ summary: '게시글 상세 조회' })
  getOne(@Param('id') id: string) {
    return this.postService.getOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @TransformResponse(PostResponseDto)
  @ApiOperation({ summary: '게시글 작성 (로그인 필요)' })
  create(@Body() dto: CreatePostDto, @Request() req: any) {
    return this.postService.create({
      authorId: req.user.id,
      content: dto.content,
      images: dto.images,
      category: dto.category,
      locationName: dto.locationName,
      locationLat: dto.locationLat,
      locationLng: dto.locationLng,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @TransformResponse(PostResponseDto)
  @ApiOperation({ summary: '게시글 수정 (본인만)' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Request() req: any) {
    return this.postService.update(id, req.user.id, {
      content: dto.content,
      images: dto.images,
      category: dto.category,
      locationName: dto.locationName,
      locationLat: dto.locationLat,
      locationLng: dto.locationLng,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '게시글 삭제 (본인 or 관리자)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.postService.remove(id, req.user.id, req.user.role);
  }
}
