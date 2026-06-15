import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller('admin/languages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  @Roles('admin', 'instructor')
  list() {
    return this.languages.list();
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateLanguageDto) {
    return this.languages.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLanguageDto) {
    return this.languages.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.languages.remove(id);
  }
}
