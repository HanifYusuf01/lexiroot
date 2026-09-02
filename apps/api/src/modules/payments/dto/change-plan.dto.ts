import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { CLIENT_PLATFORMS } from '@lexiroot/shared';
import type { ClientPlatform } from '@lexiroot/shared';

/**
 * Move a live subscription onto another plan. Unlike checkout there is no
 * `provider` override — the subscription is already bound to the provider that
 * bills it, so the only thing the client declares is the platform it's calling
 * from (which decides whether the change is ours to make or the App Store's).
 */
export class ChangePlanDto {
  @IsUUID()
  planId!: string;

  @IsOptional()
  @IsIn(CLIENT_PLATFORMS)
  platform?: ClientPlatform;

  /**
   * Acknowledges that this change ends everyone else's seat. Required whenever
   * the target plan drops family sharing and people are still on the plan — see
   * `SubscriptionsService.assertFamilySeatsFreed`.
   */
  @IsOptional()
  @IsBoolean()
  confirmRemovesSeats?: boolean;
}
