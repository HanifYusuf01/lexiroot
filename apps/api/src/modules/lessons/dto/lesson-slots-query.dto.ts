import { IsIn, IsOptional } from 'class-validator';
import { LANGUAGE_CODES, type LanguageCode } from '@lexiroot/shared';

export class LessonSlotsQueryDto {
  @IsOptional()
  @IsIn(LANGUAGE_CODES as readonly string[])
  language?: LanguageCode;
}
