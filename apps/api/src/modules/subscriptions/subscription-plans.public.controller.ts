import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PLAN_SCOPES, type PlanScope } from '@lexiroot/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionPlansService } from './subscription-plans.service';

/**
 * Read-only plan catalog for authenticated end users (mobile upgrade flow).
 * Admin CRUD lives on the role-guarded `/admin/subscription-plans` controller.
 */
@Controller('subscription-plans')
@UseGuards(JwtAuthGuard)
export class PublicSubscriptionPlansController {
  constructor(private readonly plans: SubscriptionPlansService) {}

  @Get()
  list(@Query('scope') scope?: string) {
    const valid =
      scope && (PLAN_SCOPES as readonly string[]).includes(scope)
        ? (scope as PlanScope)
        : undefined;
    return this.plans.list(valid);
  }
}
