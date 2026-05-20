import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import type { LessonStepKind } from '@lexiroot/shared';

const STEP_KINDS: LessonStepKind[] = [
  'intro',
  'content',
  'practice-intro',
  'exercise',
  'almost-there',
  'complete',
];

export class UpsertLessonProgressDto {
  @IsString()
  @Length(1, 20)
  tier!: string;

  @IsInt()
  @Min(1)
  level!: number;

  @IsInt()
  @Min(0)
  subIdx!: number;

  @IsOptional()
  @IsUUID()
  subLessonId?: string | null;

  @IsIn(STEP_KINDS)
  stepKind!: LessonStepKind;

  @IsInt()
  @Min(0)
  stepIndex!: number;

  @IsInt()
  @Min(0)
  correctCount!: number;

  @IsInt()
  @Min(0)
  xp!: number;
}
