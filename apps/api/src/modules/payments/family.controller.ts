import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AcceptFamilyInviteDto, InviteFamilyMemberDto } from './dto/family.dto';
import { FamilyService } from './family.service';

/**
 * Family plan seats. Every action is scoped to the caller: the owner manages
 * seats on the subscription they pay for, and a member may only remove
 * themselves.
 */
@Controller('subscriptions/family')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  @Get()
  overview(@CurrentUser() user: User) {
    return this.family.overview(user.id);
  }

  @Post('invites')
  @HttpCode(200)
  invite(@CurrentUser() user: User, @Body() dto: InviteFamilyMemberDto) {
    return this.family.invite(user.id, dto.email);
  }

  @Post('invites/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: User, @Body() dto: AcceptFamilyInviteDto) {
    return this.family.accept(user.id, dto.token);
  }

  @Delete('seats/:id')
  @HttpCode(200)
  removeSeat(@CurrentUser() user: User, @Param('id') id: string) {
    return this.family.removeSeat(user.id, id);
  }

  @Delete('membership')
  @HttpCode(204)
  leave(@CurrentUser() user: User) {
    return this.family.leave(user.id);
  }
}

/**
 * Unauthenticated so the accept screen can name the inviter before the invitee
 * has signed in — they may not even have an account yet. Returns only what the
 * screen needs to render; accepting still requires being signed in as the
 * invited address.
 */
@Controller('family-invites')
export class PublicFamilyInviteController {
  constructor(private readonly family: FamilyService) {}

  @Get('preview')
  preview(@Query('token') token: string) {
    return this.family.preview(token);
  }
}
