import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  EmailModule,
  JwtAccessStrategy,
  JwtRefreshStrategy,
} from '@app/common';

import { RefreshToken } from '../shared/entities/refresh-token.entity';
import { User } from '../shared/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthServicePort } from './auth.service.port';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([User, RefreshToken]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: AuthServicePort, useExisting: AuthService },
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthServicePort, AuthService],
})
export class AuthModule {}
