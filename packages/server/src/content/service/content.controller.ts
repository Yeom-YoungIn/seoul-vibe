import { Controller, Get, Query } from '@nestjs/common';
import { ContentServicePort } from './content.service.port';
import { GetContentListDto } from './dto/request/get-content-list.dto';

@Controller('content')
export class ServiceContentController {
  constructor(private readonly contentService: ContentServicePort) {}

  @Get()
  getContentsList(@Query() query: GetContentListDto) {
    return this.contentService.getContentsList({
      language: query.language,
      skip: query.skip,
      take: query.take,
    });
  }
}
