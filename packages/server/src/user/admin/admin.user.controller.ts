import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard, TransformResponse, UserRole } from '@app/common';
import { AdminUserService } from './admin.user.service';
import { ChangeRoleDto } from './dto/request/change-role.dto';
import { ListAdminUserDto } from './dto/request/list-admin-user.dto';
import {
  AdminUserListAndCountResponseDto,
  AdminUserResponseDto,
} from './dto/response/admin-user.response.dto';

@ApiTags('admin - users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users/admin')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @TransformResponse(AdminUserListAndCountResponseDto)
  @ApiOperation({ summary: '사용자 목록 조회' })
  findAll(@Query() query: ListAdminUserDto) {
    return this.adminUserService.findAll(query);
  }

  @Patch(':id/role')
  @TransformResponse(AdminUserResponseDto)
  @ApiOperation({ summary: '사용자 권한 변경' })
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.adminUserService.changeRole(id, dto.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사용자 강제 탈퇴 (소프트 삭제)' })
  remove(@Param('id') id: string) {
    return this.adminUserService.remove(id);
  }
}
