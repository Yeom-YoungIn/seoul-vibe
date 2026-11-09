import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, TransformResponse } from '@app/common';
import { UserRole } from '@app/common';
import { AdminContentService } from './admin.content.service';
import { CreateContentDto } from './dto/request/create-content.dto';
import { ListAdminContentDto } from './dto/request/list-admin-content.dto';
import { UpdateContentDto } from './dto/request/update-content.dto';
import { SourcePreviewDto } from './dto/request/source-preview.dto';
import { SourcePreviewResponseDto } from './dto/response/source-preview.response.dto';
import { SourcePreviewService } from './source/source-preview.service';
import {
  AdminContentDetailResponseDto,
  AdminContentListAndCountResponseDto,
} from './dto/response/admin-content.response.dto';

@ApiTags('admin - content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('content/admin')
export class AdminContentController {
  constructor(
    private readonly adminContentService: AdminContentService,
    private readonly sourcePreviewService: SourcePreviewService
  ) {}

  @Post('source-preview')
  @HttpCode(HttpStatus.OK)
  @TransformResponse(SourcePreviewResponseDto)
  @ApiOperation({ summary: '원문 URL 미리보기 (정규화 + OG 메타 수집)' })
  previewSource(@Body() dto: SourcePreviewDto) {
    return this.sourcePreviewService.preview(dto.url);
  }

  @Post()
  @TransformResponse(AdminContentDetailResponseDto)
  @ApiOperation({ summary: '콘텐츠 생성' })
  create(@Body() dto: CreateContentDto) {
    return this.adminContentService.create(dto);
  }

  @Get()
  @TransformResponse(AdminContentListAndCountResponseDto)
  @ApiOperation({ summary: '콘텐츠 목록 조회' })
  findAll(@Query() query: ListAdminContentDto) {
    return this.adminContentService.findAll(query);
  }

  @Get(':id')
  @TransformResponse(AdminContentDetailResponseDto)
  @ApiOperation({ summary: '콘텐츠 상세 조회' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminContentService.findOne(id);
  }

  @Put(':id')
  @TransformResponse(AdminContentDetailResponseDto)
  @ApiOperation({ summary: '콘텐츠 수정' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateContentDto) {
    return this.adminContentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '콘텐츠 삭제 (소프트)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminContentService.remove(id);
  }

  @Patch(':id/publish')
  @TransformResponse(AdminContentDetailResponseDto)
  @ApiOperation({ summary: '콘텐츠 발행' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminContentService.publish(id);
  }

  @Patch(':id/unpublish')
  @TransformResponse(AdminContentDetailResponseDto)
  @ApiOperation({ summary: '콘텐츠 발행 취소' })
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminContentService.unpublish(id);
  }
}
