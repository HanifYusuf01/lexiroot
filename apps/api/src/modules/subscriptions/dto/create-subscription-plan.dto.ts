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
  PLAN_SCOPES,
  type CurrencyCode,
  type PlanFeatureKey,
  type PlanPeriod,
  type PlanScope,
} from '@lexiroot/shared';

/** One non-base currency price on a plan write (the amount charged per period). */
export class PlanCurrencyPriceDto {
  @IsIn(NON_BASE_CURRENCIES as readonly string[], {
    message: 'currency must be a supported non-base currency',
  })
  currency!: CurrencyCode;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  price!: number;
}

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
