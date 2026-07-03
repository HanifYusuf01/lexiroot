import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { GamificationModule } from './modules/gamification/gamification.module';
import { JobsModule } from './jobs/jobs.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { LessonEntriesModule } from './modules/lesson-entries/lesson-entries.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    GamificationModule,
    LanguagesModule,
    PlatformSettingsModule,
    SubscriptionsModule,
    JobsModule,
  ],
  providers: [
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
