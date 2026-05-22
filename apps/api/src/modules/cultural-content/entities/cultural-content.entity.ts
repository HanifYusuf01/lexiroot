import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  CulturalContentBody,
  CulturalContentStatus,
  CulturalContentType,
  LanguageCode,
  LearningLevel,
} from '@lexiroot/shared';
import { User } from '../../users/entities/user.entity';

@Entity('cultural_content')
export class CulturalContent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  type!: CulturalContentType;

  @Index()
  @Column({ type: 'varchar', length: 2 })
  language!: LanguageCode;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  tier!: LearningLevel;

  @Column({ name: 'title_english', type: 'varchar', length: 200 })
  titleEnglish!: string;

  @Column({ name: 'title_translated', type: 'varchar', length: 200, default: '' })
  titleTranslated!: string;

  @Column({ name: 'short_description', type: 'varchar', length: 300, default: '' })
  shortDescription!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  body!: CulturalContentBody;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl!: string | null;

  @Column({ name: 'audio_url', type: 'text', nullable: true })
  audioUrl!: string | null;

  @Column({ name: 'audio_file_name', type: 'varchar', length: 255, nullable: true })
  audioFileName!: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: CulturalContentStatus;

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
