import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PLAN_SCOPES, type PlanScope } from '@lexiroot/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Controller('admin/subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SubscriptionPlansController {
  constructor(private readonly plans: SubscriptionPlansService) {}

  @Get()
  list(@Query('scope') scope?: string) {
    const valid = scope && (PLAN_SCOPES as readonly string[]).includes(scope)
      ? (scope as PlanScope)
      : undefined;
    return this.plans.list(valid);
  }

  @Post()
  create(@Body() dto: CreateSubscriptionPlanDto) {
    return this.plans.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.plans.update(id, dto);
  }

  /** 409 when learners are still subscribed to the plan (see service). */
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.plans.remove(id);
  }
}
