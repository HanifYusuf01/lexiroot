import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { PlanScope, SubscriptionPlan as SubscriptionPlanDto } from '@lexiroot/shared';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

/** Postgres `foreign_key_violation` — a row elsewhere still references this plan. */
const FK_VIOLATION = '23503';

function isForeignKeyViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err.driverError as { code?: string } | undefined)?.code === FK_VIOLATION
  );
}

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

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    // New plans go to the end of their scope's ordering.
    const last = await this.plans.findOne({
      where: { scope: dto.scope },
      order: { sortOrder: 'DESC' },
    });
    const plan = this.plans.create({
      scope: dto.scope,
      name: dto.name.trim(),
      price: dto.price.toFixed(2),
      period: dto.period?.trim() || 'Month',
      total: dto.total === undefined || dto.total === null ? null : dto.total.toFixed(2),
      premium: dto.premium ?? false,
      features: dto.features ?? [],
      sortOrder: (last?.sortOrder ?? -1) + 1,
    });
    const saved = await this.plans.save(plan);
    return this.toDto(saved);
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

  /**
   * Hard-delete a plan. `plan_provider_prices` rows cascade away with it; the
   * provider-side price/product is left alone (harmless once nothing references
   * it, and deleting it would break historical invoices).
   *
   * `subscriptions.plan_id` has no ON DELETE clause, so Postgres refuses to
   * delete a plan any subscription points at — billing history stays intact. We
   * let the database be the arbiter rather than pre-counting, which would race
   * with a checkout landing between the check and the delete.
   */
  async remove(id: string): Promise<void> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    try {
      await this.plans.delete(id);
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new ConflictException(
          `Cannot delete the "${plan.name}" plan — learners are subscribed to it. ` +
            `Cancel or migrate those subscriptions first.`,
        );
      }
      throw err;
    }
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
