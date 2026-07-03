import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PushDeviceDto } from '@lexiroot/shared';
import { PushDevice } from './entities/push-device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(PushDevice)
    private readonly devices: Repository<PushDevice>,
  ) {}

  /**
   * Idempotent register/refresh. Keyed on (userId, installationId) so a device
   * that rotates its Expo token — or a user who signs in on a device previously
   * used by someone else — updates the same row rather than piling up dupes.
   */
  async register(userId: string, dto: RegisterDeviceDto): Promise<PushDevice> {
    let device = await this.devices.findOne({
      where: { userId, installationId: dto.installationId },
    });

    if (!device) {
      device = this.devices.create({ userId, installationId: dto.installationId });
    }

    device.expoToken = dto.expoToken;
    device.platform = dto.platform;
    device.timezone = dto.timezone;
    device.locale = dto.locale;
    device.appVersion = dto.appVersion ?? null;
    // Re-registering always re-enables — the app only calls this after the OS
    // permission is granted, so a previously-disabled token becomes live again.
    device.enabled = true;
    device.lastSeenAt = new Date();

    return this.devices.save(device);
  }

  /** Soft-disable a device (user turned notifications off / signed out). */
  async unregister(userId: string, installationId: string): Promise<void> {
    await this.devices.update({ userId, installationId }, { enabled: false });
  }

  listForUser(userId: string): Promise<PushDevice[]> {
    return this.devices.find({ where: { userId }, order: { lastSeenAt: 'DESC' } });
  }

  /**
   * Disable every device carrying a token Expo reported as unusable
   * (DeviceNotRegistered). Called by the receipt worker.
   */
  async disableToken(expoToken: string): Promise<void> {
    const res = await this.devices.update({ expoToken }, { enabled: false });
    if (res.affected) {
      this.logger.log(`Disabled ${res.affected} device(s) for stale token`);
    }
  }

  static toDto(device: PushDevice): PushDeviceDto {
    return {
      id: device.id,
      installationId: device.installationId,
      platform: device.platform,
      timezone: device.timezone,
      locale: device.locale,
      appVersion: device.appVersion,
      enabled: device.enabled,
      lastSeenAt: device.lastSeenAt.toISOString(),
    };
  }
}
