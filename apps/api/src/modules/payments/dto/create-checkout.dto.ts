import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PROVIDER_KEYS, type ProviderKey } from '@lexiroot/shared';

export class CreateCheckoutDto {
  @IsUUID()
  planId!: string;

  /** Defaults to the server's configured default provider (stripe today). */
  @IsOptional()
  @IsIn(PROVIDER_KEYS)
  provider?: ProviderKey;

  /** App deep link to bounce back to after checkout (mobile). */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnDeepLink?: string;
}
