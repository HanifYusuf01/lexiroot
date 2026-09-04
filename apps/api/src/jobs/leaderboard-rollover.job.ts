import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LeaderboardService } from '../modules/gamification/leaderboard.service';

/**
 * Closes the weekly competition.
 *
 * Runs hourly rather than once at midnight Monday: `rollOver` is guarded on the
 * week already having been settled, so extra runs cost one count query and do
 * nothing — while a single weekly tick that happened to fall during a deploy
 * would leave the week unsettled until the next one, stranding promotions and
 * leaving "last week's rank" empty for everybody.
 */
@Injectable()
export class LeaderboardRolloverJob {
  private readonly logger = new Logger(LeaderboardRolloverJob.name);

  constructor(private readonly leaderboard: LeaderboardService) {}

  @Cron('0 * * * *')
  async run(): Promise<void> {
    try {
      const { settled } = await this.leaderboard.rollOver();
      if (settled > 0) {
        this.logger.log(`Leaderboard: settled ${settled} standings for the closed week`);
      }
    } catch (err) {
      this.logger.error(`Leaderboard rollover failed: ${(err as Error).message}`);
    }
  }
}
