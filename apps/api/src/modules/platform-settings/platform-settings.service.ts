import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PlatformSettings as PlatformSettingsDto } from '@lexiroot/shared';
import { PlatformSettings } from './entities/platform-settings.entity';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

const SINGLETON_ID = 1;

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settings: Repository<PlatformSettings>,
  ) {}

  async getOrCreate(): Promise<PlatformSettingsDto> {
    let row = await this.settings.findOne({ where: { id: SINGLETON_ID } });
    if (!row) {
      row = await this.settings.save(this.settings.create({ id: SINGLETON_ID }));
    }
    return this.toDto(row);
  }

  async update(dto: UpdatePlatformSettingsDto): Promise<PlatformSettingsDto> {
    const row = (await this.settings.findOne({ where: { id: SINGLETON_ID } })) ??
      this.settings.create({ id: SINGLETON_ID });
    Object.assign(row, dto);
    const saved = await this.settings.save(row);
    return this.toDto(saved);
  }

  private toDto(row: PlatformSettings): PlatformSettingsDto {
    const { updatedAt, id: _id, ...rest } = row;
    void _id;
    return { ...rest, updatedAt: updatedAt.toISOString() };
  }
}
