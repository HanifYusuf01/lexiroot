import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SubscriptionsService } from './subscriptions.service';

/**
 * Authenticated subscription endpoints. Every action is implicitly scoped to the
 * caller (`CurrentUser`) — a user can only ever act on their own subscription
 * (Rule 9d).
 */
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: User, @Body() dto: CreateCheckoutDto) {
    // The payment provider is resolved server-side from the caller's platform and
    // the user's country — the client never picks it (see providerPreference).
    return this.subscriptions.createCheckout({
      userId: user.id,
      userEmail: user.email,
      userCountry: user.country,
      planId: dto.planId,
      platform: dto.platform,
      provider: dto.provider,
      returnDeepLink: dto.returnDeepLink,
    });
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.subscriptions.getMySubscription(user.id);
  }

  @Post('cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: User) {
    return this.subscriptions.cancel(user.id);
  }
}
