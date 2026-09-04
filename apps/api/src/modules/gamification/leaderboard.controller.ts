import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import type {
  FamilyLeaderboardResponse,
  FriendsLeaderboardResponse,
  LeaderboardResponse,
} from '@lexiroot/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { LeaderboardQueryDto, UpdateLeaderboardOptOutDto } from './dto/leaderboard.dto';
import { LeaderboardService } from './leaderboard.service';

/**
 * The weekly leaderboard. Every figure is computed here — the app reports what
 * a learner did and reads back where that puts them; it never claims a score.
 */
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  board(
    @CurrentUser() user: User,
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponse> {
    return this.leaderboard.board(user.id, query);
  }

  /** The caller's household, ranked together — no league or language split. */
  @Get('family')
  family(@CurrentUser() user: User): Promise<FamilyLeaderboardResponse> {
    return this.leaderboard.familyBoard(user.id);
  }

  /** The caller and their friends, ranked together. */
  @Get('friends')
  friends(@CurrentUser() user: User): Promise<FriendsLeaderboardResponse> {
    return this.leaderboard.friendsBoard(user.id);
  }

  /**
   * Leave or rejoin public rankings. Opting out never stops RP being earned —
   * progress, streaks and the learner's own figures carry on unchanged; they
   * simply stop appearing in other people's lists.
   */
  @Patch('opt-out')
  setOptOut(@CurrentUser() user: User, @Body() dto: UpdateLeaderboardOptOutDto) {
    return this.leaderboard.setOptOut(user.id, dto.optedOut);
  }
}
