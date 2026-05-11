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
import { ExercisesService } from './exercises.service';
import { ReplaceExercisesDto } from './dto/replace-exercises.dto';

@Controller('lessons/:lessonId/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(@Param('lessonId', new ParseUUIDPipe()) lessonId: string) {
    return this.exercises.listByLesson(lessonId);
  }

  @Put()
  replace(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: ReplaceExercisesDto,
  ) {
    return this.exercises.replaceForLesson(lessonId, dto);
  }
}
