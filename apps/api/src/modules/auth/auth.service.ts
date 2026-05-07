import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import type { CountryCode } from '@lexiroot/shared';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from './email.service';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    emailVerifiedAt: Date | null;
    country: CountryCode | null;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verification = this.createEmailVerification();
    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      language: dto.language ?? null,
      level: dto.level ?? null,
      learningReason: dto.reason ?? null,
      country: dto.country ?? null,
      emailVerificationToken: verification.token,
      emailVerificationExpiresAt: verification.expiresAt,
    });
    await this.email.sendVerificationEmail({
      email: user.email,
      displayName: user.displayName,
      verificationUrl: this.buildEmailVerificationUrl(verification.token),
    });
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email is not verified');
    }
    await this.users.touchActivity(user.id);
    user.lastActiveAt = new Date();
    return this.toAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    const user = await this.users.findByEmailVerificationToken(dto.token);
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.emailVerifiedAt = user.emailVerifiedAt ?? new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpiresAt = null;
    await this.users.update(user.id, {
      emailVerifiedAt: user.emailVerifiedAt,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    });
    return this.toAuthResponse(user);
  }

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || user.emailVerifiedAt) {
      return;
    }
    const verification = this.createEmailVerification();
    await this.users.update(user.id, {
      emailVerificationToken: verification.token,
      emailVerificationExpiresAt: verification.expiresAt,
    });
    await this.email.sendVerificationEmail({
      email: user.email,
      displayName: user.displayName,
      verificationUrl: this.buildEmailVerificationUrl(verification.token),
    });
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      return;
    }
    const token = randomBytes(RESET_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.users.update(user.id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.users.findByPasswordResetToken(dto.token);
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.users.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.users.update(user.id, { passwordHash });
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.users.findByEmail(dto.email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email already in use');
      }
      user.email = dto.email;
      const verification = this.createEmailVerification();
      user.emailVerifiedAt = null;
      user.emailVerificationToken = verification.token;
      user.emailVerificationExpiresAt = verification.expiresAt;
      await this.email.sendVerificationEmail({
        email: user.email,
        displayName: user.displayName,
        verificationUrl: this.buildEmailVerificationUrl(verification.token),
      });
    }
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.language !== undefined) user.language = dto.language;
    if (dto.level !== undefined) user.level = dto.level;
    if (dto.reason !== undefined) user.learningReason = dto.reason;
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.users.update(user.id, {
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt,
      language: user.language,
      level: user.level,
      learningReason: user.learningReason,
      country: user.country,
      avatarUrl: user.avatarUrl,
      emailVerificationToken: user.emailVerificationToken,
      emailVerificationExpiresAt: user.emailVerificationExpiresAt,
    });
    return this.toMePayload(user);
  }

  toMePayload(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      language: user.language,
      level: user.level,
      learningReason: user.learningReason,
      country: user.country,
      avatarUrl: user.avatarUrl,
    };
  }

  private toAuthResponse(user: User): AuthResponse {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        country: user.country,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private createEmailVerification(): { token: string; expiresAt: Date } {
    return {
      token: randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('hex'),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    };
  }

  private buildEmailVerificationUrl(token: string): string {
    const baseUrl = this.config.get<string>('MOBILE_APP_URL') ?? 'lexiroot://verify-email';
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
  }
}
