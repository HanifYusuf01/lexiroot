import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { UpsertLessonProgressDto } from './dto/upsert-lesson-progress.dto';
import { ProgressService } from './progress.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get('progress')
  summary(@CurrentUser() user: User) {
    return this.progress.summary(user.id);
  }

  @Post('lessons/:lessonId/complete')
  complete(
    @CurrentUser() user: User,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: CompleteLessonDto,
  ) {
    return this.progress.completeLesson(user.id, lessonId, dto.correctCount, dto.totalCount);
  }

  @Get('lesson-progress')
  activeProgress(@CurrentUser() user: User) {
    return this.progress.getActiveProgress(user.id);
  }

  @Put('lesson-progress')
  upsertProgress(@CurrentUser() user: User, @Body() dto: UpsertLessonProgressDto) {
    return this.progress.upsertProgress(user.id, dto);
  }

  @Delete('lesson-progress/:tier/:level')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearProgress(
    @CurrentUser() user: User,
    @Param('tier') tier: string,
    @Param('level', ParseIntPipe) level: number,
  ): Promise<void> {
    await this.progress.clearProgress(user.id, tier, level);
  }
}
