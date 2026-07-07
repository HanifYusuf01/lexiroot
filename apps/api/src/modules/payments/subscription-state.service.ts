import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import type { SubscriptionStatus } from '@lexiroot/shared';
import { Subscription } from './entities/subscription.entity';

/** Legal subscription transitions. A status may also stay itself (renewals). */
const LEGAL_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  INCOMPLETE: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'EXPIRED'],
  TRIALING: ['ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED', 'EXPIRED'],
  ACTIVE: ['ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED', 'EXPIRED'],
  PAST_DUE: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  PAUSED: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: ['EXPIRED', 'ACTIVE'],
  EXPIRED: [],
};

export interface SubscriptionPatch {
  status: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date | null;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
}

/**
 * The single writer for subscription-row transitions (Rule 1). Every move locks
 * the row (`pessimistic_write`, Rule 2d) and is guarded on the current state so
 * a replayed event is a no-op (Rule 2a). Illegal transitions are rejected (and
 * logged) rather than silently applied. Callers pass the surrounding
 * transaction's EntityManager so the change is atomic with sibling writes.
 */
@Injectable()
export class SubscriptionStateService {
  private readonly logger = new Logger(SubscriptionStateService.name);

  isLegal(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
    if (from === to) return true;
    return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
  }

  /**
   * Lock the subscription, validate the transition, and apply the patch. Returns
   * the updated row, or null when the transition is illegal (guarded no-op) —
   * the money/period fields are left untouched in that case.
   */
  async apply(
    manager: EntityManager,
    subscriptionId: string,
    patch: SubscriptionPatch,
  ): Promise<Subscription | null> {
    const repo = manager.getRepository(Subscription);
    const sub = await repo
      .createQueryBuilder('sub')
      .setLock('pessimistic_write')
      .where('sub.id = :id', { id: subscriptionId })
      .getOne();

    if (!sub) {
      this.logger.warn(`apply: subscription ${subscriptionId} not found`);
      return null;
    }

    if (!this.isLegal(sub.status, patch.status)) {
      this.logger.warn(
        `apply: illegal transition ${sub.status} → ${patch.status} for ${subscriptionId} (ignored)`,
      );
      return null;
    }

    sub.status = patch.status;
    if (patch.currentPeriodStart !== undefined) sub.currentPeriodStart = patch.currentPeriodStart;
    if (patch.currentPeriodEnd !== undefined) sub.currentPeriodEnd = patch.currentPeriodEnd;
    if (patch.cancelAtPeriodEnd !== undefined) sub.cancelAtPeriodEnd = patch.cancelAtPeriodEnd;
    if (patch.canceledAt !== undefined) sub.canceledAt = patch.canceledAt;
    if (patch.providerSubscriptionId !== undefined) {
      sub.providerSubscriptionId = patch.providerSubscriptionId;
    }
    if (patch.providerCustomerId !== undefined) {
      sub.providerCustomerId = patch.providerCustomerId;
    }

    return repo.save(sub);
  }
}
