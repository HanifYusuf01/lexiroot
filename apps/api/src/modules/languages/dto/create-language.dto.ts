import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { TEACHING_LANGUAGE_STATUSES, type TeachingLanguageStatus } from '@lexiroot/shared';

export class CreateLanguageDto {
  @IsString()
  @Matches(/^[a-z]{2,3}$/, { message: 'code must be a 2–3 letter lowercase ISO code' })
  code!: string;

  @IsString()
  @Length(2, 60)
  name!: string;

  @IsOptional()
  @IsIn(TEACHING_LANGUAGE_STATUSES as readonly string[])
  status?: TeachingLanguageStatus;
}
