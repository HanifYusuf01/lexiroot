import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { LessonEntriesService } from './lesson-entries.service';
import { ReplaceLessonEntriesDto } from './dto/replace-lesson-entries.dto';

@Controller('lessons/:lessonId/entries')
@UseGuards(JwtAuthGuard)
export class LessonEntriesController {
  constructor(private readonly entries: LessonEntriesService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.entries.listByLesson(lessonId, { id: user.id, role: user.role });
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('admin', 'instructor')
  replace(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: ReplaceLessonEntriesDto,
  ) {
    return this.entries.replaceForLesson(lessonId, dto);
  }
}
