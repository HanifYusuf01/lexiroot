import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  DURATION_BUCKETS,
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  LESSON_STATUSES,
  LESSON_TYPES,
  type DurationBucket,
  type LanguageCode,
  type LearningLevel,
  type LessonMeta,
  type LessonStatus,
  type LessonType,
} from '@lexiroot/shared';

export class CreateLessonDto {
  @IsIn(LANGUAGE_CODES as readonly string[])
  language!: LanguageCode;

  @IsIn(LEARNING_LEVELS as readonly string[])
  level!: LearningLevel;

  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shortDescription?: string;

  @IsOptional()
  @IsIn(DURATION_BUCKETS as readonly string[])
  estimatedDuration?: DurationBucket;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  xpReward?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  orderInUnit?: number;

  @IsIn(LESSON_TYPES as readonly string[])
  type!: LessonType;

  @IsOptional()
  @IsBoolean()
  speechRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  offlineAvailable?: boolean;

  @IsOptional()
  @IsIn(LESSON_STATUSES as readonly string[])
  status?: LessonStatus;

  @IsOptional()
  @IsObject()
  meta?: LessonMeta;
}
