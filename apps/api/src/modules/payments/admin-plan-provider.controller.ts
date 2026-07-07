import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
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

  @Post(':id/sync-provider')
  syncProvider(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SyncPlanProviderDto,
  ) {
    return this.sync.sync(id, dto.provider);
  }
}
