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

  // Languages are a runtime catalog (admin Settings), so we only shape-check
  // here; the service validates the code against the DB.
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
}
