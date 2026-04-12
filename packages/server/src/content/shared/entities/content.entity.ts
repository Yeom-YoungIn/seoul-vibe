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

  @OneToMany(() => ContentTranslation, (translation) => translation.content, { cascade: true })
  translations!: ContentTranslation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
