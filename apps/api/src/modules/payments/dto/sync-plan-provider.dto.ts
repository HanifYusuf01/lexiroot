import { IsIn, IsOptional } from 'class-validator';
import { PROVIDER_KEYS, type ProviderKey } from '@lexiroot/shared';

export class SyncPlanProviderDto {
  /** Defaults to the server's configured default provider (stripe today). */
  @IsOptional()
  @IsIn(PROVIDER_KEYS)
  provider?: ProviderKey;
}
