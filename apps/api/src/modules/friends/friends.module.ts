import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/entities/user.entity';
import { FriendInvite } from './entities/friend-invite.entity';
import { Friendship } from './entities/friendship.entity';
import { FriendsController, PublicFriendInviteController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendInvite, Friendship, User]),
    // Invitations are delivered by EmailService, which AuthModule owns.
    forwardRef(() => AuthModule),
  ],
  controllers: [FriendsController, PublicFriendInviteController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
