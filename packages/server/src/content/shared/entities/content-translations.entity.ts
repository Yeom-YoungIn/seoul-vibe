import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Content } from './content.entity';

@Entity('content_translations')
@Index(['content', 'locale'], { unique: true })
export class ContentTranslation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10 })
  locale!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  bodyHtml?: string | null;

  @Column({ type: 'text', nullable: true })
  bodyText?: string | null;

  @ManyToOne(() => Content, (content) => content.translations, { onDelete: 'CASCADE' })
  content!: Content;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
