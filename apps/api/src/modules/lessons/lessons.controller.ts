import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ListLessonsQueryDto } from './dto/list-lessons-query.dto';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get()
  list(@Query() query: ListLessonsQueryDto) {
    return this.lessons.paginate(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  stats() {
    return this.lessons.stats();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessons.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@CurrentUser() user: User, @Body() dto: CreateLessonDto) {
    return this.lessons.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateLessonDto) {
    return this.lessons.update(id, dto);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('admin')
  archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.lessons.archive(id);
  }
}
