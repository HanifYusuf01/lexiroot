import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PROVIDER_KEYS, type ProviderKey } from '@lexiroot/shared';

export class SyncPlanProviderDto {
  /** Defaults to the server's configured default provider (stripe today). */
  @IsOptional()
  @IsIn(PROVIDER_KEYS)
  provider?: ProviderKey;

  /**
   * Apple IAP only: the product id created manually in App Store Connect.
   * Ignored by providers that mint their own product (Stripe, Paystack).
   */
  @IsOptional()
  @IsString()
  @MaxLength(256)
  providerProductId?: string;
}
