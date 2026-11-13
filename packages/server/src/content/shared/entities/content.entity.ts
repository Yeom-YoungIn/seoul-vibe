import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentTranslation } from './content-translations.entity';
import { SourceType } from '../types/source-type';

@Entity('contents')
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'boolean', default: false })
  isPublished: boolean = false;

  @Column({ type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  sourceUrl?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sourceType?: SourceType | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  sourceTitle?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceDescription?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceSiteName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceAuthor?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sourceImagePath?: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  coverImageUrl?: string | null;

  @OneToMany(() => ContentTranslation, (translation) => translation.content, { cascade: true })
  translations!: ContentTranslation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
