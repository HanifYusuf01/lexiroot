import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CULTURAL_CONTENT_STATUSES,
  CULTURAL_CONTENT_TYPES,
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  type CulturalContentStatus,
  type CulturalContentType,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';

export class ListCulturalContentQueryDto {
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
  @IsIn(CULTURAL_CONTENT_TYPES as readonly string[])
  type?: CulturalContentType;

  @IsOptional()
  @IsIn(LANGUAGE_CODES as readonly string[])
  language?: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  tier?: LearningLevel;

  @IsOptional()
  @IsIn(CULTURAL_CONTENT_STATUSES as readonly string[])
  status?: CulturalContentStatus;
}
