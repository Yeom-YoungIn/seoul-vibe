import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  tokenHash!: string;

  @Column({ type: 'timestamp with time zone' })
  expiresAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
