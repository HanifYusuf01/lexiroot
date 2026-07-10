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
  PLAN_SCOPES,
  type CurrencyCode,
  type PlanFeatureKey,
  type PlanScope,
} from '@lexiroot/shared';

/** One non-base currency price on a plan write (USD lives in price/total). */
export class PlanCurrencyPriceDto {
  @IsIn(NON_BASE_CURRENCIES as readonly string[], {
    message: 'currency must be a supported non-base currency',
  })
  currency!: CurrencyCode;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  price!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  total?: number | null;
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
  @IsString()
  @Length(1, 20)
  period?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  total?: number | null;

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
