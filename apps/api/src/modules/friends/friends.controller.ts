import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AcceptFriendInviteDto, InviteFriendDto } from './dto/friends.dto';
import { FriendsService } from './friends.service';

/** Friends and friend invitations. Every action is scoped to the caller. */
@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  overview(@CurrentUser() user: User) {
    return this.friends.overview(user.id);
  }

  @Post('invites')
  @HttpCode(200)
  invite(@CurrentUser() user: User, @Body() dto: InviteFriendDto) {
    return this.friends.invite(user.id, dto.email);
  }

  @Post('invites/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: User, @Body() dto: AcceptFriendInviteDto) {
    return this.friends.accept(user.id, dto.token);
  }

  /** Removes a friend, or withdraws an invitation the caller sent. */
  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentUser() user: User, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.friends.remove(user.id, id);
  }
}

/**
 * Unauthenticated so the accept screen can name the inviter before the invitee
 * has signed in — they may not have an account yet. Returns only what that
 * screen needs; accepting still requires being signed in as the invited address.
 */
@Controller('friend-invites')
export class PublicFriendInviteController {
  constructor(private readonly friends: FriendsService) {}

  @Get('preview')
  preview(@Query('token') token: string) {
    return this.friends.preview(token);
  }
}
