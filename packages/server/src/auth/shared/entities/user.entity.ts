import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@app/common';
import { RefreshToken } from './refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 50 })
  nickname!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string | null;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean = false;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerifyToken?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  emailVerifyTokenExpiresAt?: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole = UserRole.USER;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
  refreshTokens!: RefreshToken[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
