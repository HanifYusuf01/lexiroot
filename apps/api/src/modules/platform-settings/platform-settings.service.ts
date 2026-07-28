import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NON_BASE_CURRENCIES,
  type PlatformSettings as PlatformSettingsDto,
  type PublicPlatformSettings,
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
    if (dto.fxRatesToUsd) this.assertValidFxRates(dto.fxRatesToUsd);
    const row = (await this.settings.findOne({ where: { id: SINGLETON_ID } })) ??
      this.settings.create({ id: SINGLETON_ID });
    Object.assign(row, dto);
    const saved = await this.settings.save(row);
    this.cache = null; // invalidate so changes take effect immediately
    return this.toDto(saved);
  }

  /**
   * class-validator has no built-in "map of CurrencyCode → positive number"
   * shape, so this is checked here instead of on the DTO: every key must be a
   * real non-base currency and every value a positive finite rate.
   */
  private assertValidFxRates(rates: Record<string, unknown>): void {
    for (const [currency, rate] of Object.entries(rates)) {
      if (!(NON_BASE_CURRENCIES as readonly string[]).includes(currency)) {
        throw new BadRequestException(`Unsupported currency in fxRatesToUsd: ${currency}`);
      }
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        throw new BadRequestException(`Invalid FX rate for ${currency}`);
      }
    }
  }

  private toDto(row: PlatformSettings): PlatformSettingsDto {
    const { updatedAt, id: _id, ...rest } = row;
    void _id;
    return { ...rest, updatedAt: updatedAt.toISOString() };
  }
}
