import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettings } from '../settings/entities/user-settings.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { NotificationOutbox } from './entities/notification-outbox.entity';
import { PushDevice } from './entities/push-device.entity';
import { NotificationsService } from './notifications.service';
import { PushSenderService } from './push-sender.service';

/**
 * Owns push-device registration and the enqueue side of notifications. The
 * *draining* side (outbox worker, receipt checker) lives in JobsModule, which
 * imports this module to reuse these services.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushDevice,
      NotificationOutbox,
      NotificationDelivery,
      UserSettings,
    ]),
  ],
  controllers: [DevicesController],
  providers: [DevicesService, NotificationsService, PushSenderService],
  exports: [DevicesService, NotificationsService, PushSenderService, TypeOrmModule],
})
export class NotificationsModule {}
