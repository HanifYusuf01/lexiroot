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

export class SignupDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[^\d]+$/, { message: 'Full name cannot contain numbers' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'Password must include 1 capital letter' })
  @Matches(/[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/, {
    message: 'Password must include 1 symbol',
  })
  password!: string;

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
}
