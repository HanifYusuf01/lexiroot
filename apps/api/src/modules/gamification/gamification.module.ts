import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { User } from '../users/entities/user.entity';
import { Achievement } from './entities/achievement.entity';
import { LeaderboardSnapshot } from './entities/leaderboard-snapshot.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { XpLedgerEntry } from './entities/xp-ledger-entry.entity';
import { GamificationAdminController } from './gamification-admin.controller';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      XpLedgerEntry,
      LeaderboardSnapshot,
      User,
    ]),
    // Root Point values and league thresholds are admin-configured.
    PlatformSettingsModule,
  ],
  controllers: [GamificationController, GamificationAdminController, LeaderboardController],
  providers: [GamificationService, LeaderboardService],
  exports: [GamificationService, LeaderboardService],
})
export class GamificationModule {}
