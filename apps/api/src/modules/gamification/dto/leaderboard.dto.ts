import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LANGUAGE_CODES, LEAGUES, LEARNING_LEVELS } from '@lexiroot/shared';
import type { LanguageCode, League, LearningLevel } from '@lexiroot/shared';

/**
 * Filters for the public board. All optional — an omitted filter falls back to
 * the caller's own language, level and league, so opening the screen lands them
 * on the board they actually compete in.
 */
export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  language?: LanguageCode;

  @IsOptional()
  @IsIn(LEARNING_LEVELS)
  level?: LearningLevel;

  @IsOptional()
  @IsIn(LEAGUES)
  league?: League;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateLeaderboardOptOutDto {
  @IsBoolean()
  optedOut!: boolean;
}
