import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PlanScope, SubscriptionPlan as SubscriptionPlanDto } from '@lexiroot/shared';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
  ) {}

  async list(scope?: PlanScope): Promise<SubscriptionPlanDto[]> {
    const rows = await this.plans.find({
      where: scope ? { scope } : {},
      order: { scope: 'ASC', sortOrder: 'ASC' },
    });
    return rows.map((row) => this.toDto(row));
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.price !== undefined) plan.price = dto.price.toFixed(2);
    if (dto.period !== undefined) plan.period = dto.period;
    if (dto.total !== undefined) plan.total = dto.total === null ? null : dto.total.toFixed(2);
    if (dto.premium !== undefined) plan.premium = dto.premium;
    if (dto.features !== undefined) plan.features = dto.features;

    const saved = await this.plans.save(plan);
    return this.toDto(saved);
  }

  private toDto(row: SubscriptionPlan): SubscriptionPlanDto {
    return {
      id: row.id,
      scope: row.scope,
      name: row.name,
      price: Number(row.price),
      period: row.period,
      total: row.total === null ? null : Number(row.total),
      premium: row.premium,
      features: row.features ?? [],
      sortOrder: row.sortOrder,
    };
  }
}
