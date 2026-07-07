import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { AdminPlanProviderController } from './admin-plan-provider.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { BillingService } from './billing.service';
import { EntitlementService } from './entitlement.service';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentRefund } from './entities/payment-refund.entity';
import { PlanProviderPrice } from './entities/plan-provider-price.entity';
import { Subscription } from './entities/subscription.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PlanProviderSyncService } from './plan-provider-sync.service';
import { AppleIapProvider } from './providers/apple-iap.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { PaystackProvider } from './providers/paystack.provider';
import { StripeProvider } from './providers/stripe.provider';
import { SubscriptionStateService } from './subscription-state.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

/**
 * The transactional payments/subscriptions module. Owns the provider-neutral
 * domain (subscriptions, invoices, payments, methods, refunds, webhook log) and
 * the entitlement source of truth. Exports EntitlementService so AuthModule can
 * surface features on /auth/me.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Invoice,
      Payment,
      PaymentMethod,
      PaymentRefund,
      PlanProviderPrice,
      WebhookEvent,
      SubscriptionPlan,
    ]),
  ],
  controllers: [
    SubscriptionsController,
    WebhooksController,
    AdminPlanProviderController,
    AdminSubscriptionsController,
  ],
  providers: [
    StripeProvider,
    PaystackProvider,
    AppleIapProvider,
    PaymentProviderRegistry,
    SubscriptionStateService,
    EntitlementService,
    BillingService,
    SubscriptionsService,
    WebhooksService,
    PlanProviderSyncService,
  ],
  exports: [EntitlementService, BillingService, SubscriptionStateService],
})
export class PaymentsModule {}
