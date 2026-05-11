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
import { EXERCISE_SUB_TYPES, type ExerciseSubType } from '@lexiroot/shared';

export class ExerciseInputDto {
  @IsIn(EXERCISE_SUB_TYPES as readonly string[])
  subType!: ExerciseSubType;

  @IsInt()
  @Min(0)
  orderIndex!: number;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class ReplaceExercisesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExerciseInputDto)
  exercises!: ExerciseInputDto[];
}
