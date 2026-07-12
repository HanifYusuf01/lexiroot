import { Type } from 'class-transformer';
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
  ValidateNested,
} from 'class-validator';
import {
  NON_BASE_CURRENCIES,
  PLAN_FEATURE_KEYS,
  PLAN_PERIODS,
  type PlanFeatureKey,
  type PlanPeriod,
} from '@lexiroot/shared';
import { PlanCurrencyPriceDto } from './create-subscription-plan.dto';

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  price?: number;

  @IsOptional()
  @IsIn(PLAN_PERIODS as readonly string[], { message: 'period must be Month, Quarter, or Year' })
  period?: PlanPeriod;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(NON_BASE_CURRENCIES.length)
  @ValidateNested({ each: true })
  @Type(() => PlanCurrencyPriceDto)
  prices?: PlanCurrencyPriceDto[];

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
