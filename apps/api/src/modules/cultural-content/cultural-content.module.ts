import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { CulturalContent } from './entities/cultural-content.entity';
import { CulturalContentController } from './cultural-content.controller';
import { CulturalContentService } from './cultural-content.service';

@Module({
  imports: [TypeOrmModule.forFeature([CulturalContent]), NotificationsModule],
  controllers: [CulturalContentController],
  providers: [CulturalContentService],
  exports: [CulturalContentService],
})
export class CulturalContentModule {}
