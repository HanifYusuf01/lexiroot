import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { XpLedgerEntry } from './entities/xp-ledger-entry.entity';
import { GamificationAdminController } from './gamification-admin.controller';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement, XpLedgerEntry, User])],
  controllers: [GamificationController, GamificationAdminController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
