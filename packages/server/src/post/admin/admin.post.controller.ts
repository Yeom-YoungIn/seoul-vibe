import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard, TransformResponse, UserRole } from '@app/common';
import {
  AdminPostFeedResponseDto,
  AdminPostResponseDto,
} from '../service/dto/response/post.response.dto';
import { AdminPostService } from './admin.post.service';
import { ListAdminPostDto } from './dto/request/list-admin-post.dto';

@ApiTags('admin - posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('posts/admin')
export class AdminPostController {
  constructor(private readonly adminPostService: AdminPostService) {}

  @Get()
  @TransformResponse(AdminPostFeedResponseDto)
  @ApiOperation({ summary: '게시글 전체 목록 (관리자)' })
  findAll(@Query() query: ListAdminPostDto) {
    return this.adminPostService.findAll(query);
  }

  @Patch(':id/hide')
  @TransformResponse(AdminPostResponseDto)
  @ApiOperation({ summary: '게시글 숨김' })
  hide(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPostService.hide(id);
  }

  @Patch(':id/unhide')
  @TransformResponse(AdminPostResponseDto)
  @ApiOperation({ summary: '게시글 숨김 해제' })
  unhide(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPostService.unhide(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '게시글 강제 삭제 (관리자)' })
  forceRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPostService.forceRemove(id);
  }
}
