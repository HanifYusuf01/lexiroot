import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { InactivityReengagementJob } from './inactivity-reengagement.job';

@Module({
  imports: [AuthModule],
  providers: [InactivityReengagementJob],
})
export class JobsModule {}
