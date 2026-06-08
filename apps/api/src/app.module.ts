import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LastActiveInterceptor } from './common/interceptors/last-active.interceptor';
import { RlsContextInterceptor } from './common/interceptors/rls-context.interceptor';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CulturalContentModule } from './modules/cultural-content/cultural-content.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { LessonEntriesModule } from './modules/lesson-entries/lesson-entries.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { PlatformSettingsModule } from './modules/platform-settings/platform-settings.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    CategoriesModule,
    CulturalContentModule,
    LessonsModule,
    ExercisesModule,
    LessonEntriesModule,
    ProgressModule,
    SettingsModule,
    FeedbackModule,
    UploadsModule,
    AnalyticsModule,
    GamificationModule,
    LanguagesModule,
    PlatformSettingsModule,
    SubscriptionsModule,
  ],
  providers: [
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
