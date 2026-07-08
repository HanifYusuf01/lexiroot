import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CLIENT_PLATFORMS, PROVIDER_KEYS } from '@lexiroot/shared';
import type { ClientPlatform, ProviderKey } from '@lexiroot/shared';

export class CreateCheckoutDto {
  @IsUUID()
  planId!: string;

  /**
   * Calling platform. Drives server-side provider resolution together with the
   * authenticated user's country — clients send this and omit `provider`.
   */
  @IsOptional()
  @IsIn(CLIENT_PLATFORMS)
  platform?: ClientPlatform;

  /**
   * Explicit override that bypasses resolution (admin/testing). Rejected when the
   * named provider isn't live.
   */
  @IsOptional()
  @IsIn(PROVIDER_KEYS)
  provider?: ProviderKey;

  /** App deep link to bounce back to after checkout (mobile). */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnDeepLink?: string;
}
