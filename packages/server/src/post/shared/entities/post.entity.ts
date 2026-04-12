import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../auth/shared/entities/user.entity';

export enum PostCategory {
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  ETC = 'etc',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  author!: User;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', array: true, default: '{}' })
  images: string[] = [];

  @Column({ type: 'enum', enum: PostCategory, default: PostCategory.ETC })
  category: PostCategory = PostCategory.ETC;

  @Column({ type: 'varchar', length: 255, nullable: true })
  locationName?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLat?: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLng?: number | null;

  @Column({ type: 'int', default: 0 })
  likeCount: number = 0;

  @Column({ type: 'boolean', default: false })
  isHidden: boolean = false;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
