import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { LESSON_ENTRY_KINDS, type LessonEntryKind } from '@lexiroot/shared';

export class LessonEntryInputDto {
  @IsIn(LESSON_ENTRY_KINDS as readonly string[])
  kind!: LessonEntryKind;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class ReplaceLessonEntriesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => LessonEntryInputDto)
  entries!: LessonEntryInputDto[];
}
