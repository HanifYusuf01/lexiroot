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
import { ExercisesService } from './exercises.service';
import { ReplaceExercisesDto } from './dto/replace-exercises.dto';

@Controller('lessons/:lessonId/exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
  ) {
    return this.exercises.listByLesson(lessonId, { id: user.id, role: user.role });
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('admin', 'instructor')
  replace(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Body() dto: ReplaceExercisesDto,
  ) {
    return this.exercises.replaceForLesson(lessonId, dto);
  }
}
