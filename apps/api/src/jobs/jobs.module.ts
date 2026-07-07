import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { InactivityReengagementJob } from './inactivity-reengagement.job';
import { PushOutboxJob } from './push-outbox.job';
import { PushReceiptsJob } from './push-receipts.job';
import { StreakReminderJob } from './streak-reminder.job';
import { SubscriptionExpiryJob } from './subscription-expiry.job';
import { SubscriptionReconciliationJob } from './subscription-reconciliation.job';

@Module({
  imports: [AuthModule, NotificationsModule, PaymentsModule],
  providers: [
    InactivityReengagementJob,
    PushOutboxJob,
    PushReceiptsJob,
    StreakReminderJob,
    SubscriptionExpiryJob,
    SubscriptionReconciliationJob,
  ],
})
export class JobsModule {}
