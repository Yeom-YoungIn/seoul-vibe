import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, JwtRefreshGuard } from '@app/common';

import { LoginDto } from './dto/request/login.dto';
import { SignupDto } from './dto/request/signup.dto';
import { AuthServicePort } from './auth.service.port';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthServicePort) {}

  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  async signup(@Body() dto: SignupDto): Promise<void> {
    await this.authService.signup({
      email: dto.email,
      password: dto.password,
      nickname: dto.nickname,
    });
  }

  @Get('verify-email')
  @ApiOperation({ summary: '이메일 인증' })
  async verifyEmail(@Query('token') token: string): Promise<void> {
    await this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login({ email: dto.email, password: dto.password });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: '로그아웃' })
  async logout(@Request() req: any): Promise<void> {
    await this.authService.logout(req.user.id, req.user.tokenId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Access Token 갱신' })
  async refresh(@Request() req: any) {
    return this.authService.refresh(req.user.id, req.user.tokenId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 정보 조회' })
  getMe(@Request() req: any) {
    return req.user;
  }
}
