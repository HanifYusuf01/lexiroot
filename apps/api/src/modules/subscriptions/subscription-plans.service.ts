import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  BASE_CURRENCY,
  type CurrencyCode,
  type PlanPeriod,
  type PlanPriceOverrides,
  type PlanScope,
  type SubscriptionPlan as SubscriptionPlanDto,
} from '@lexiroot/shared';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import {
  CreateSubscriptionPlanDto,
  PlanCurrencyPriceDto,
} from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

/** Convert the write DTO's price array into the stored per-currency map. */
function toPriceOverrides(prices: PlanCurrencyPriceDto[]): PlanPriceOverrides {
  const map: PlanPriceOverrides = {};
  for (const entry of prices) {
    map[entry.currency] = { price: entry.price };
  }
  return map;
}

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

  /** Admin catalog view: base (USD) amounts plus the full per-currency map. */
  async list(scope?: PlanScope): Promise<SubscriptionPlanDto[]> {
    const rows = await this.find(scope);
    return rows.map((row) => this.toDto(row, BASE_CURRENCY, true));
  }

  /**
   * Public catalog view for a user, resolved to `currency`: each plan's amounts
   * are returned in that currency when priced in it, else the base (USD) — the
   * same currency the user would actually be charged. The override map is
   * omitted (end users don't need it).
   */
  async listForCurrency(currency: CurrencyCode, scope?: PlanScope): Promise<SubscriptionPlanDto[]> {
    const rows = await this.find(scope);
    return rows.map((row) => this.toDto(row, currency, false));
  }

  private find(scope?: PlanScope): Promise<SubscriptionPlan[]> {
    return this.plans.find({
      where: scope ? { scope } : {},
      order: { scope: 'ASC', sortOrder: 'ASC' },
    });
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
      period: dto.period ?? 'Month',
      total: null,
      prices: dto.prices ? toPriceOverrides(dto.prices) : {},
      premium: dto.premium ?? false,
      features: dto.features ?? [],
      sortOrder: (last?.sortOrder ?? -1) + 1,
    });
    const saved = await this.plans.save(plan);
    return this.toDto(saved, BASE_CURRENCY, true);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanDto> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.price !== undefined) plan.price = dto.price.toFixed(2);
    if (dto.period !== undefined) plan.period = dto.period;
    if (dto.prices !== undefined) plan.prices = toPriceOverrides(dto.prices);
    if (dto.premium !== undefined) plan.premium = dto.premium;
    if (dto.features !== undefined) plan.features = dto.features;

    const saved = await this.plans.save(plan);
    return this.toDto(saved, BASE_CURRENCY, true);
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

  /**
   * Resolve a plan row to `currency`. Non-base currency uses the override when
   * present, else falls back to the base amount (so a plan not priced in the
   * user's currency still shows a sensible price and matches the USD checkout it
   * would fall back to). `includeOverrides` attaches the raw map for admin edit.
   */
  private toDto(
    row: SubscriptionPlan,
    currency: CurrencyCode,
    includeOverrides: boolean,
  ): SubscriptionPlanDto {
    const override = currency !== BASE_CURRENCY ? row.prices?.[currency] : undefined;
    const resolvedCurrency: CurrencyCode = override ? currency : BASE_CURRENCY;
    const price = override ? override.price : Number(row.price);

    return {
      id: row.id,
      scope: row.scope,
      name: row.name,
      price,
      currency: resolvedCurrency,
      period: row.period as PlanPeriod,
      ...(includeOverrides ? { prices: row.prices ?? {} } : {}),
      premium: row.premium,
      features: row.features ?? [],
      sortOrder: row.sortOrder,
    };
  }
}
