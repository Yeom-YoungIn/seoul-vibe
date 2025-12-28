import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ContentServicePort } from './content.service.port';
import { GetContentListDto } from './dto/request/get-content-list.dto';
import { GetContentDetailDto } from './dto/request/get-content-detail.dto';

@ApiTags('content')
@Controller('content')
export class ServiceContentController {
  constructor(private readonly contentService: ContentServicePort) {}

  @Get()
  @ApiOperation({ summary: '컨텐츠 목록 조회' })
  getContentsList(@Query() query: GetContentListDto) {
    return this.contentService.getContentsList({
      language: query.language,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get(':slug')
  @ApiOperation({ summary: '컨텐츠 상세 조회' })
  getContentDetail(@Param('slug') slug: string, @Query() query: GetContentDetailDto) {
    return this.contentService.getContentDetail({
      slug,
      language: query.language,
    });
  }
}
