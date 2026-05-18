import { IsInt, Min } from 'class-validator';

export class CompleteLessonDto {
  @IsInt()
  @Min(0)
  correctCount!: number;

  @IsInt()
  @Min(0)
  totalCount!: number;
}
