import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  CULTURAL_CONTENT_STATUSES,
  CULTURAL_CONTENT_TYPES,
  LANGUAGE_CODES,
  LEARNING_LEVELS,
  type CulturalContentBody,
  type CulturalContentStatus,
  type CulturalContentType,
  type LanguageCode,
  type LearningLevel,
} from '@lexiroot/shared';

export class CreateCulturalContentDto {
  @IsIn(CULTURAL_CONTENT_TYPES as readonly string[])
  type!: CulturalContentType;

  @IsIn(LANGUAGE_CODES as readonly string[])
  language!: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS as readonly string[])
  tier?: LearningLevel;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  titleEnglish!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  titleTranslated?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @IsObject()
  body!: CulturalContentBody;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  audioUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  audioFileName?: string | null;

  @IsOptional()
  @IsIn(CULTURAL_CONTENT_STATUSES as readonly string[])
  status?: CulturalContentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000000)
  views?: number;
}
