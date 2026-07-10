import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SyncPlanProviderDto } from './dto/sync-plan-provider.dto';
import { PlanProviderSyncService } from './plan-provider-sync.service';

/**
 * Admin endpoint to provision a plan's provider price so it becomes purchasable.
 * Distinct sub-path from SubscriptionPlansController's CRUD on the same base.
 */
@Controller('admin/subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPlanProviderController {
  constructor(private readonly sync: PlanProviderSyncService) {}

  /**
   * Sync state for every plan, keyed by plan id. Declared before the `:id`
   * routes on this base path is unnecessary (no `:id` GET exists), but keeping
   * the static segment first is the safe habit.
   */
  @Get('provider-sync')
  providerSync() {
    return this.sync.listSyncState();
  }

  /** Sync a plan to every live provider at once (the admin default). */
  @Post(':id/sync')
  syncAll(@Param('id', ParseUUIDPipe) id: string) {
    return this.sync.syncAll(id);
  }

  /** Targeted sync to a single provider (testing / recovery). */
  @Post(':id/sync-provider')
  syncProvider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncPlanProviderDto,
  ) {
    return this.sync.sync(id, dto.provider);
  }
}
