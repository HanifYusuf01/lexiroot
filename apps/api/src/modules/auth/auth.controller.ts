import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePendingEmailDto } from './dto/change-pending-email.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // Sends an email on every accepted call, billed to us and delivered to an
  // address the caller does not have to own. Tight enough that looping it is
  // pointless, loose enough for a person who mistypes and retries.
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  // Credential stuffing. The account lockout protects one account; this limits
  // how many accounts a single source can try.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.googleAuth(dto);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  apple(@Body() dto: AppleAuthDto) {
    return this.auth.appleAuth(dto);
  }

  // Guards a six-digit code. The per-code attempt counter caps a single reset;
  // this caps how fast anyone can work through codes at all.
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  // Sends an email on every accepted call, billed to us and delivered to an
  // address the caller does not have to own. Tight enough that looping it is
  // pointless, loose enough for a person who mistypes and retries.
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
    await this.auth.resendVerification(dto);
  }

  // Sends an email on every accepted call, billed to us and delivered to an
  // address the caller does not have to own. Tight enough that looping it is
  // pointless, loose enough for a person who mistypes and retries.
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @Post('change-pending-email')
  @HttpCode(HttpStatus.OK)
  changePendingEmail(@Body() dto: ChangePendingEmailDto) {
    return this.auth.changePendingEmail(dto);
  }

  // Sends an email on every accepted call, billed to us and delivered to an
  // address the caller does not have to own. Tight enough that looping it is
  // pointless, loose enough for a person who mistypes and retries.
  @Throttle({ default: { ttl: 3_600_000, limit: 5 } })
  @Post('request-password-reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto): Promise<void> {
    await this.auth.requestPasswordReset(dto);
  }

  // Guards a six-digit code. The per-code attempt counter caps a single reset;
  // this caps how fast anyone can work through codes at all.
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.auth.getMe(user);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(user.id, dto);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async deleteMe(@CurrentUser() user: User): Promise<void> {
    await this.auth.deleteAccount(user.id);
  }
}
