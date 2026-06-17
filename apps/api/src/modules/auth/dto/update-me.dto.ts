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
  LEARNING_LEVELS,
  LEARNING_REASONS,
  type CountryCode,
  type LearningLevel,
  type LearningReason,
} from '@lexiroot/shared';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[^\d]+$/, { message: 'Full name cannot contain numbers' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2,3}$/, { message: 'language must be a 2–3 letter code' })
  language?: string;

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
  @MaxLength(512)
  avatarUrl?: string;
}
