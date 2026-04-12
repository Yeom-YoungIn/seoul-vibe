import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { EmailService } from '@app/common';
import { UserRole } from '@app/common';
import { RefreshToken } from '../shared/entities/refresh-token.entity';
import { User } from '../shared/entities/user.entity';
import {
  EmailAlreadyExistsError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidVerifyTokenError,
} from '../shared/errors/auth.errors';
import { AuthService } from './auth.service';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockRefreshTokenRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
});

const mockConfigService = () => ({
  getOrThrow: jest.fn().mockReturnValue('mock-secret'),
  get: jest.fn().mockReturnValue('15m'),
});

const mockEmailService = () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
});

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    nickname: 'tester',
    role: UserRole.USER,
    isEmailVerified: true,
    emailVerifyToken: null,
    emailVerifyTokenExpiresAt: null,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User);

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let refreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useFactory: mockRefreshTokenRepository },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: EmailService, useFactory: mockEmailService },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    emailService = module.get(EmailService);
  });

  describe('signup', () => {
    it('새 유저를 생성하고 인증 메일을 발송한다', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(buildUser({ isEmailVerified: false }));
      userRepo.save.mockResolvedValue(buildUser({ isEmailVerified: false }));

      await service.signup({ email: 'test@example.com', password: 'password123', nickname: 'tester' });

      expect(userRepo.save).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('이미 존재하는 이메일이면 EmailAlreadyExistsError를 던진다', async () => {
      userRepo.findOne.mockResolvedValue(buildUser());

      await expect(
        service.signup({ email: 'test@example.com', password: 'password123', nickname: 'tester' }),
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });

  describe('verifyEmail', () => {
    it('유효한 토큰으로 이메일 인증에 성공한다', async () => {
      const user = buildUser({
        isEmailVerified: false,
        emailVerifyToken: 'valid-token',
        emailVerifyTokenExpiresAt: new Date(Date.now() + 60_000),
      });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, isEmailVerified: true });

      await service.verifyEmail('valid-token');

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isEmailVerified: true, emailVerifyToken: null }),
      );
    });

    it('존재하지 않는 토큰이면 InvalidVerifyTokenError를 던진다', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(InvalidVerifyTokenError);
    });

    it('만료된 토큰이면 InvalidVerifyTokenError를 던진다', async () => {
      const user = buildUser({
        emailVerifyToken: 'expired-token',
        emailVerifyTokenExpiresAt: new Date(Date.now() - 1000),
      });
      userRepo.findOne.mockResolvedValue(user);

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(InvalidVerifyTokenError);
    });
  });

  describe('login', () => {
    it('올바른 자격증명과 인증된 이메일로 토큰을 발급한다', async () => {
      const user = buildUser();
      userRepo.findOne.mockResolvedValue(user);
      const tokenRecord = { id: 'token-uuid', tokenHash: '', expiresAt: new Date(), user } as RefreshToken;
      refreshTokenRepo.create.mockReturnValue(tokenRecord);
      refreshTokenRepo.save.mockResolvedValue(tokenRecord);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('존재하지 않는 이메일이면 InvalidCredentialsError를 던진다', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'none@example.com', password: 'password123' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('비밀번호가 틀리면 InvalidCredentialsError를 던진다', async () => {
      userRepo.findOne.mockResolvedValue(buildUser());

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('이메일 미인증 유저는 EmailNotVerifiedError를 던진다', async () => {
      userRepo.findOne.mockResolvedValue(buildUser({ isEmailVerified: false }));

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(EmailNotVerifiedError);
    });
  });

  describe('logout', () => {
    it('해당 RefreshToken을 삭제한다', async () => {
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.logout('user-uuid', 'token-uuid');

      expect(refreshTokenRepo.delete).toHaveBeenCalledWith({
        id: 'token-uuid',
        user: { id: 'user-uuid' },
      });
    });
  });

  describe('refresh', () => {
    it('유효한 RefreshToken으로 새 토큰 쌍을 발급한다', async () => {
      const user = buildUser();
      const stored = {
        id: 'token-uuid',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        user,
      } as RefreshToken;
      refreshTokenRepo.findOne.mockResolvedValue(stored);
      refreshTokenRepo.create.mockReturnValue(stored);
      refreshTokenRepo.save.mockResolvedValue(stored);
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.refresh('user-uuid', 'token-uuid');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepo.delete).toHaveBeenCalledWith(stored.id);
    });

    it('존재하지 않는 토큰이면 InvalidRefreshTokenError를 던진다', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh('user-uuid', 'bad-token')).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it('만료된 토큰이면 InvalidRefreshTokenError를 던지고 삭제한다', async () => {
      const stored = {
        id: 'token-uuid',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1000),
        user: buildUser(),
      } as RefreshToken;
      refreshTokenRepo.findOne.mockResolvedValue(stored);
      refreshTokenRepo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.refresh('user-uuid', 'token-uuid')).rejects.toThrow(
        InvalidRefreshTokenError,
      );
      expect(refreshTokenRepo.delete).toHaveBeenCalledWith(stored.id);
    });
  });
});
