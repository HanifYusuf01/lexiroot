import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AdminInvitation } from './entities/admin-invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminInvitation, User]), UsersModule, AuthModule],
  controllers: [AdminsController],
  providers: [AdminsService],
})
export class AdminsModule {}
