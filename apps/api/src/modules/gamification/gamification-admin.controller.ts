import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamificationService } from './gamification.service';

@Controller('admin/gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class GamificationAdminController {
  constructor(private readonly gamification: GamificationService) {}

  @Get('stats')
  stats() {
    return this.gamification.adminStats();
  }

  @Get('top-earners')
  topEarners(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(14), ParseIntPipe) limit: number,
  ) {
    return this.gamification.topEarners(page, limit);
  }
}
