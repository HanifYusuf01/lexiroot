import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { GamificationModule } from '../modules/gamification/gamification.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { InactivityReengagementJob } from './inactivity-reengagement.job';
import { PushOutboxJob } from './push-outbox.job';
import { PushReceiptsJob } from './push-receipts.job';
import { StreakReminderJob } from './streak-reminder.job';
import { SubscriptionExpiryJob } from './subscription-expiry.job';
import { SubscriptionReconciliationJob } from './subscription-reconciliation.job';
import { LeaderboardRolloverJob } from './leaderboard-rollover.job';

@Module({
  imports: [AuthModule, GamificationModule, NotificationsModule, PaymentsModule],
  providers: [
    LeaderboardRolloverJob,
    InactivityReengagementJob,
    PushOutboxJob,
    PushReceiptsJob,
    StreakReminderJob,
    SubscriptionExpiryJob,
    SubscriptionReconciliationJob,
  ],
})
export class JobsModule {}
