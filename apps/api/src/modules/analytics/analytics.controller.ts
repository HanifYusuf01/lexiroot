import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // Overview cards/charts power the dashboard home, which instructors can see.
  @Get('overview')
  @Roles('admin', 'instructor')
  overview() {
    return this.analytics.overview();
  }

  // Full analytics dashboard. `from`/`to` are inclusive YYYY-MM-DD UTC days;
  // both optional — defaults to the last 7 days.
  @Get('dashboard')
  @Roles('admin')
  dashboard(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.dashboard(from, to);
  }

  // Revenue / subscription detail page.
  @Get('revenue')
  @Roles('admin')
  revenue(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analytics.revenueDetail(from, to);
  }
}
