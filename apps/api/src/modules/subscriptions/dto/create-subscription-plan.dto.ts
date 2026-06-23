import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  PLAN_FEATURE_KEYS,
  PLAN_SCOPES,
  type PlanFeatureKey,
  type PlanScope,
} from '@lexiroot/shared';

export class CreateSubscriptionPlanDto {
  @IsIn(PLAN_SCOPES as readonly string[], { message: 'scope must be individual or family' })
  scope!: PlanScope;

  @IsString()
  @Length(1, 60)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  price!: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  period?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  total?: number | null;

  @IsOptional()
  @IsBoolean()
  premium?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(PLAN_FEATURE_KEYS.length)
  @IsIn(PLAN_FEATURE_KEYS as readonly string[], {
    each: true,
    message: 'features must be valid plan feature keys',
  })
  features?: PlanFeatureKey[];
}
