import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '@app/common';
import { User } from '../../auth/shared/entities/user.entity';
import { AdminUserService } from './admin.user.service';

const mockUserRepository = () => ({
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
});

const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: 'hashed',
    nickname: 'testuser',
    profileImage: null,
    nationality: null,
    isEmailVerified: true,
    emailVerifyToken: null,
    emailVerifyTokenExpiresAt: null,
    role: UserRole.USER,
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as User);

describe('AdminUserService', () => {
  let service: AdminUserService;
  let userRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get(AdminUserService);
    userRepo = module.get(getRepositoryToken(User));
  });

  describe('findAll', () => {
    it('사용자 목록과 개수를 반환한다', async () => {
      const users = [buildUser()];
      userRepo.findAndCount.mockResolvedValue([users, 1]);

      const [list, count] = await service.findAll({ skip: 0, take: 20 });

      expect(list).toHaveLength(1);
      expect(count).toBe(1);
      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it('email 검색 조건을 ILike로 적용한다', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ email: 'john', skip: 0, take: 20 });

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({}),
        }),
      );
    });

    it('skip/take 기본값(0/20)을 사용한다', async () => {
      userRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(userRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('changeRole', () => {
    it('사용자 역할을 admin으로 변경한다', async () => {
      const user = buildUser({ role: UserRole.USER });
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, role: UserRole.ADMIN });

      const result = await service.changeRole('user-uuid', UserRole.ADMIN);

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.ADMIN }),
      );
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('존재하지 않는 사용자면 NotFoundException을 던진다', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.changeRole('bad-id', UserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('사용자를 소프트 삭제한다', async () => {
      const user = buildUser();
      userRepo.findOne.mockResolvedValue(user);
      userRepo.softRemove.mockResolvedValue(user);

      await service.remove('user-uuid');

      expect(userRepo.softRemove).toHaveBeenCalledWith(user);
    });

    it('존재하지 않는 사용자면 NotFoundException을 던진다', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
