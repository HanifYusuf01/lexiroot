import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import {
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsIn(LANGUAGE_CODES as readonly string[])
  language?: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  level?: LearningLevel;
}
