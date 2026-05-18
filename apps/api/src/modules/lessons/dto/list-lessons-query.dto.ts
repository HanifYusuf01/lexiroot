import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  LESSON_STATUSES,
  type LanguageCode,
  type LearningLevel,
  type LessonStatus,
} from '@lexiroot/shared';

export class ListLessonsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsIn(LANGUAGE_CODES as readonly string[])
  language?: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  tier?: LearningLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number;

  @IsOptional()
  @IsIn(LESSON_STATUSES as readonly string[])
  status?: LessonStatus;
}
