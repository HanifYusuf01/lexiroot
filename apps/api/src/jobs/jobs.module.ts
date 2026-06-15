import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { PlatformSettingsModule } from '../modules/platform-settings/platform-settings.module';
import { InactivityReengagementJob } from './inactivity-reengagement.job';

@Module({
  imports: [AuthModule, PlatformSettingsModule],
  providers: [InactivityReengagementJob],
})
export class JobsModule {}
