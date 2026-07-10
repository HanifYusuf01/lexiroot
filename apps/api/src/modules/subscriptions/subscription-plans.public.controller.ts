import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PLAN_SCOPES, currencyForCountry, type PlanScope } from '@lexiroot/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlansService } from './subscription-plans.service';

/**
 * Read-only plan catalog for authenticated end users (mobile upgrade flow).
 * Prices are resolved to the caller's local currency (from their country) — the
 * same currency they'll be charged. Admin CRUD lives on the role-guarded
 * `/admin/subscription-plans` controller.
 */
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard)
export class PublicSubscriptionPlansController {
  constructor(private readonly plans: SubscriptionPlansService) {}

  @Get()
  list(@CurrentUser() user: User, @Query('scope') scope?: string) {
    const valid =
      scope && (PLAN_SCOPES as readonly string[]).includes(scope)
        ? (scope as PlanScope)
        : undefined;
    return this.plans.listForCurrency(currencyForCountry(user.country), valid);
  }
}
