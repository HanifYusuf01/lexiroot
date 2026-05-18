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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LessonEntriesService } from './lesson-entries.service';
import { ReplaceLessonEntriesDto } from './dto/replace-lesson-entries.dto';

@Controller('lessons/:lessonId/entries')
@UseGuards(JwtAuthGuard)
export class LessonEntriesController {
  constructor(private readonly entries: LessonEntriesService) {}

  @Get()
  list(@Param('lessonId', new ParseUUIDPipe()) lessonId: string) {
    return this.entries.listByLesson(lessonId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('admin')
  replace(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: ReplaceLessonEntriesDto,
  ) {
    return this.entries.replaceForLesson(lessonId, dto);
  }
}
