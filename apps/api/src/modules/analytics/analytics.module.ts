import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { XpLedgerEntry } from '../gamification/entities/xp-ledger-entry.entity';
import { Language } from '../languages/entities/language.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { LessonCompletion } from '../progress/entities/lesson-completion.entity';
import { LessonProgress } from '../progress/entities/lesson-progress.entity';
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
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
