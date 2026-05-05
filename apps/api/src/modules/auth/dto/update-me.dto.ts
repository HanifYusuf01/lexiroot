import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  COUNTRY_CODES,
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  LEARNING_REASONS,
  type CountryCode,
  type LanguageCode,
  type LearningLevel,
  type LearningReason,
} from '@lexiroot/shared';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsIn(LANGUAGE_CODES as readonly string[])
  language?: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  level?: LearningLevel;

  @IsOptional()
  @IsIn(LEARNING_REASONS as readonly string[])
  reason?: LearningReason;

  @IsOptional()
  @IsIn(COUNTRY_CODES as readonly string[])
  country?: CountryCode;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^\+\d{6,20}$/, { message: 'phone must be in international format (e.g. +2348012345678)' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  avatarUrl?: string;
}
