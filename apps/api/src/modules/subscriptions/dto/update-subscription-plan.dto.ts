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
import { NON_BASE_CURRENCIES, PLAN_FEATURE_KEYS, type PlanFeatureKey } from '@lexiroot/shared';
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
