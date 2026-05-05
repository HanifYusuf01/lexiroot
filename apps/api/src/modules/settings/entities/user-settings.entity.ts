import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type {
  LanguageLevelPref,
  LessonDifficulty,
  VoicePlaybackSpeed,
} from '@lexiroot/shared';
import { User } from '../../users/entities/user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'sound_haptics', type: 'boolean', default: false })
  soundHaptics!: boolean;

  @Column({ name: 'language_level', type: 'varchar', length: 20, nullable: true })
  languageLevel!: LanguageLevelPref | null;

  @Column({ name: 'lesson_difficulty', type: 'varchar', length: 20, nullable: true })
  lessonDifficulty!: LessonDifficulty | null;

  @Column({ name: 'autoplay_audio', type: 'boolean', default: false })
  autoplayAudio!: boolean;

  @Column({ name: 'voice_playback_speed', type: 'varchar', length: 20, nullable: true })
  voicePlaybackSpeed!: VoicePlaybackSpeed | null;

  @Column({ name: 'microphone_access', type: 'boolean', default: false })
  microphoneAccess!: boolean;

  @Column({ name: 'streak_reminder', type: 'boolean', default: false })
  streakReminder!: boolean;

  @Column({ name: 'achievement_alerts', type: 'boolean', default: false })
  achievementAlerts!: boolean;

  @Column({ name: 'daily_reminder', type: 'boolean', default: false })
  dailyReminder!: boolean;

  @Column({ name: 'daily_reminder_time', type: 'varchar', length: 5, nullable: true })
  dailyReminderTime!: string | null;

  @Column({ name: 'cultural_content_alert', type: 'boolean', default: false })
  culturalContentAlert!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
