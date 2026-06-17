import { Controller, Get } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * Public, unauthenticated subset of platform settings — used by the mobile app
 * to show the platform name/tagline and render a maintenance screen.
 */
@Controller('platform-settings')
export class PublicPlatformSettingsController {
  constructor(private readonly settings: PlatformSettingsService) {}

  @Get('public')
  getPublic() {
    return this.settings.getPublic();
  }
}
