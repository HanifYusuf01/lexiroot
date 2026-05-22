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
import { CulturalContentService } from './cultural-content.service';
import { CreateCulturalContentDto } from './dto/create-cultural-content.dto';
import { UpdateCulturalContentDto } from './dto/update-cultural-content.dto';
import { ListCulturalContentQueryDto } from './dto/list-cultural-content-query.dto';

@Controller('cultural-content')
@UseGuards(JwtAuthGuard)
export class CulturalContentController {
  constructor(private readonly service: CulturalContentService) {}

  @Get()
  list(@Query() query: ListCulturalContentQueryDto) {
    return this.service.paginate(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  stats() {
    return this.service.stats();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  create(@CurrentUser() user: User, @Body() dto: CreateCulturalContentDto) {
    return this.service.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCulturalContentDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/archive')
  @UseGuards(RolesGuard)
  @Roles('admin')
  archive(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.archive(id);
  }
}
