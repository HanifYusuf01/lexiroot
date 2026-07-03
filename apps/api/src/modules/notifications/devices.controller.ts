import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('me/devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  async list(@CurrentUser() user: User) {
    const rows = await this.devices.listForUser(user.id);
    return rows.map(DevicesService.toDto);
  }

  @Post()
  async register(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    const device = await this.devices.register(user.id, dto);
    return DevicesService.toDto(device);
  }

  @Delete(':installationId')
  @HttpCode(204)
  async unregister(@CurrentUser() user: User, @Param('installationId') installationId: string) {
    await this.devices.unregister(user.id, installationId);
  }
}
