import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { EmailService } from '@app/common';
import { RefreshToken } from '../shared/entities/refresh-token.entity';
import { User } from '../shared/entities/user.entity';
import {
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidVerifyTokenError,
} from '../shared/errors/auth.errors';
import { AuthServicePort, LoginInput, SignupInput, TokenPair } from './auth.service.port';

const BCRYPT_ROUNDS = 10;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

@Injectable()
export class AuthService implements AuthServicePort {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService
  ) {}

  async signup(input: SignupInput): Promise<void> {
    const existing = await this.userRepository.findOne({ where: { email: input.email } });
    if (existing) throw new EmailAlreadyExistsError();

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const emailVerifyToken = randomUUID();
    const emailVerifyTokenExpiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    const shouldSendMail = this.configService.get('MAIL_SEND_ENABLED', 'false') === 'true';

    const user = this.userRepository.create({
      email: input.email,
      passwordHash,
      nickname: input.nickname,
      isEmailVerified: !shouldSendMail,
      emailVerifyToken: shouldSendMail ? emailVerifyToken : null,
      emailVerifyTokenExpiresAt: shouldSendMail ? emailVerifyTokenExpiresAt : null,
    });

    await this.userRepository.save(user);

    if (shouldSendMail) {
      await this.emailService.sendVerificationEmail(input.email, emailVerifyToken);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerifyToken: token },
    });

    if (!user || !user.emailVerifyTokenExpiresAt || user.emailVerifyTokenExpiresAt < new Date()) {
      throw new InvalidVerifyTokenError();
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyTokenExpiresAt = null;
    await this.userRepository.save(user);
  }

  async login(input: LoginInput): Promise<TokenPair> {
    const user = await this.userRepository.findOne({ where: { email: input.email } });
    if (!user) throw new InvalidCredentialsError();

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) throw new InvalidCredentialsError();

    if (!user.isEmailVerified) throw new EmailNotVerifiedError();

    return this.issueTokenPair(user);
  }

  async logout(userId: string, tokenId: string): Promise<void> {
    await this.refreshTokenRepository.delete({ id: tokenId, user: { id: userId } });
  }

  async refresh(userId: string, tokenId: string): Promise<TokenPair> {
    const stored = await this.refreshTokenRepository.findOne({
      where: { id: tokenId, user: { id: userId } },
      relations: ['user'],
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.refreshTokenRepository.delete(stored.id);
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenRepository.delete(stored.id);
    return this.issueTokenPair(stored.user);
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const tokenRecord = this.refreshTokenRepository.create({
      tokenHash: randomUUID(), // placeholder — overwritten below
      expiresAt: new Date(
        Date.now() + parseInt(this.configService.get('JWT_REFRESH_EXPIRES_MS', '604800000'))
      ),
      user,
    });
    await this.refreshTokenRepository.save(tokenRecord);

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenId: tokenRecord.id },
      {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    );

    tokenRecord.tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.refreshTokenRepository.save(tokenRecord);

    return { accessToken, refreshToken };
  }
}
