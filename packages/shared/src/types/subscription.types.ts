export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  tier: string;
  startedAt: string;
  expiresAt: string | null;
}
