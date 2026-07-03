import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { InactivityReengagementJob } from './inactivity-reengagement.job';
import { PushOutboxJob } from './push-outbox.job';
import { PushReceiptsJob } from './push-receipts.job';
import { StreakReminderJob } from './streak-reminder.job';

@Module({
  imports: [AuthModule, NotificationsModule],
  providers: [
    InactivityReengagementJob,
    PushOutboxJob,
    PushReceiptsJob,
    StreakReminderJob,
  ],
})
export class JobsModule {}
