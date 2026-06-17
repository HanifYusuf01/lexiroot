import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  PlatformSettings as PlatformSettingsDto,
  PublicPlatformSettings,
} from '@lexiroot/shared';
import { PlatformSettings } from './entities/platform-settings.entity';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

const SINGLETON_ID = 1;
const CACHE_TTL_MS = 10_000;

@Injectable()
export class PlatformSettingsService {
  private cache: { value: PlatformSettingsDto; at: number } | null = null;

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

  /**
   * Short-TTL cached read for hot paths (maintenance guard on every request,
   * email branding) to avoid a DB round-trip per call.
   */
  async getCached(): Promise<PlatformSettingsDto> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
      return this.cache.value;
    }
    const value = await this.getOrCreate();
    this.cache = { value, at: Date.now() };
    return value;
  }

  async getPublic(): Promise<PublicPlatformSettings> {
    const s = await this.getCached();
    return {
      platformName: s.platformName,
      platformTagline: s.platformTagline,
      maintenanceMode: s.maintenanceMode,
      showDowntimeMessage: s.showDowntimeMessage,
    };
  }

  async update(dto: UpdatePlatformSettingsDto): Promise<PlatformSettingsDto> {
    const row = (await this.settings.findOne({ where: { id: SINGLETON_ID } })) ??
      this.settings.create({ id: SINGLETON_ID });
    Object.assign(row, dto);
    const saved = await this.settings.save(row);
    this.cache = null; // invalidate so changes take effect immediately
    return this.toDto(saved);
  }

  private toDto(row: PlatformSettings): PlatformSettingsDto {
    const { updatedAt, id: _id, ...rest } = row;
    void _id;
    return { ...rest, updatedAt: updatedAt.toISOString() };
  }
}
