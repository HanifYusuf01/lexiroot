import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
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
}
