import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly settings: Repository<UserSettings>,
  ) {}

  /** Returns the current user's settings, creating a default row if it doesn't exist. */
  async getOrCreate(userId: string): Promise<UserSettings> {
    let row = await this.settings.findOne({ where: { userId } });
    if (!row) {
      row = this.settings.create({ userId });
      row = await this.settings.save(row);
    }
    return row;
  }

  async update(userId: string, dto: UpdateSettingsDto): Promise<UserSettings> {
    const row = await this.getOrCreate(userId);
    Object.assign(row, dto);
    return this.settings.save(row);
  }
}
