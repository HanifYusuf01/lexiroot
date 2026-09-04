import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { paymentsConfig } from './config/payments.config';
import { LastActiveInterceptor } from './common/interceptors/last-active.interceptor';
import { MaintenanceInterceptor } from './common/interceptors/maintenance.interceptor';
import { RlsContextInterceptor } from './common/interceptors/rls-context.interceptor';
import { AdminsModule } from './modules/admins/admins.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CulturalContentModule } from './modules/cultural-content/cultural-content.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { FriendsModule } from './modules/friends/friends.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { JobsModule } from './jobs/jobs.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { LessonEntriesModule } from './modules/lesson-entries/lesson-entries.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [paymentsConfig] }),
    ScheduleModule.forRoot(),
    // A blanket ceiling per client IP. Deliberately generous — the mobile app is
    // chatty, and a limit that trips during normal study would be worse than no
    // limit at all. It exists to stop scripted abuse: brute-forcing six-digit
    // codes, and looping the endpoints that send email, every one of which is
    // billed to us. Individual routes tighten it further (see AuthController),
    // and provider webhooks skip it entirely so retries are never refused.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AdminsModule,
    CategoriesModule,
    CulturalContentModule,
    LessonsModule,
    ExercisesModule,
    LessonEntriesModule,
    ProgressModule,
    SettingsModule,
    NotificationsModule,
    FeedbackModule,
    UploadsModule,
    AnalyticsModule,
    FriendsModule,
    GamificationModule,
    LanguagesModule,
    PlatformSettingsModule,
    SubscriptionsModule,
    PaymentsModule,
    JobsModule,
  ],
  providers: [
    // Global rate limit. A guard rather than an interceptor so abusive traffic
    // is refused before any handler — and before any email is sent.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Maintenance gate runs first so blocked traffic short-circuits early.
    {
      provide: APP_INTERCEPTOR,
      useClass: MaintenanceInterceptor,
    },
    // Order matters: RLS context first so the GUC is set before any handler
    // touches an RLS-protected table; LastActive runs after.
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LastActiveInterceptor,
    },
  ],
})
export class AppModule {}
