import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UserRole } from '@app/common';
import { User } from '../../auth/shared/entities/user.entity';
import { ListAdminUserDto } from './dto/request/list-admin-user.dto';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(dto: ListAdminUserDto): Promise<[User[], number]> {
    return this.userRepository.findAndCount({
      where: dto.email ? { email: ILike(`%${dto.email}%`) } : {},
      order: { createdAt: 'DESC' },
      skip: dto.skip ?? 0,
      take: dto.take ?? 20,
    });
  }

  async changeRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOne(id);
    user.role = role;
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  private async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ errorCode: 'USER_NOT_FOUND', message: 'User not found' });
    return user;
  }
}
