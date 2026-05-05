import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import {
  LANGUAGE_LEVEL_PREFS,
  LESSON_DIFFICULTIES,
  VOICE_PLAYBACK_SPEEDS,
  type LanguageLevelPref,
  type LessonDifficulty,
  type VoicePlaybackSpeed,
} from '@lexiroot/shared';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean()
  soundHaptics?: boolean;

  @IsOptional()
  @IsIn(LANGUAGE_LEVEL_PREFS as readonly string[])
  languageLevel?: LanguageLevelPref | null;

  @IsOptional()
  @IsIn(LESSON_DIFFICULTIES as readonly string[])
  lessonDifficulty?: LessonDifficulty | null;

  @IsOptional()
  @IsBoolean()
  autoplayAudio?: boolean;

  @IsOptional()
  @IsIn(VOICE_PLAYBACK_SPEEDS as readonly string[])
  voicePlaybackSpeed?: VoicePlaybackSpeed | null;

  @IsOptional()
  @IsBoolean()
  microphoneAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  streakReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  achievementAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  dailyReminder?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'dailyReminderTime must be HH:MM (24-hour)' })
  dailyReminderTime?: string | null;

  @IsOptional()
  @IsBoolean()
  culturalContentAlert?: boolean;
}
