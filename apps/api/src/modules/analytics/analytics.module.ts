import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XpLedgerEntry } from '../gamification/entities/xp-ledger-entry.entity';
import { Language } from '../languages/entities/language.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Invoice } from '../payments/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Subscription } from '../payments/entities/subscription.entity';
import { SubscriptionStatusEvent } from '../payments/entities/subscription-status-event.entity';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { User } from '../users/entities/user.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UserActiveDay } from './entities/user-active-day.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Lesson,
      LessonCompletion,
      LessonProgress,
      XpLedgerEntry,
      UserActiveDay,
      Language,
      Subscription,
      Invoice,
      Payment,
      SubscriptionPlan,
      SubscriptionStatusEvent,
    ]),
    PlatformSettingsModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
