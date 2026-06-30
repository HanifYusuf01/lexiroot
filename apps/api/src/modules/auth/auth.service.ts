import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { LanguagesService } from '../languages/languages.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { User, UserRole } from '../users/entities/user.entity';
import type {
  CountryCode,
  LanguageCode,
  LearningLevel,
  LearningReason,
} from '@lexiroot/shared';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePendingEmailDto } from './dto/change-pending-email.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from './email.service';
import { PendingSignup } from './entities/pending-signup.entity';
import { PendingSignupsService } from './pending-signups.service';

const BCRYPT_ROUNDS = 12;
const RESET_CODE_TTL_MS = 1000 * 60 * 60;
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 15;
const LOCKOUT_MS = 1000 * 60 * 15;

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
    language: LanguageCode | null;
    level: LearningLevel | null;
    learningReason: LearningReason | null;
    xp: number;
    currentStreakDays: number;
    lessonsCompleted: number;
  };
}

export interface GoogleAuthResponse extends AuthResponse {
  /** True when this Google sign-in just created the account (routes to onboarding). */
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly pendingSignups: PendingSignupsService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly languagesService: LanguagesService,
    private readonly platformSettings: PlatformSettingsService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private readonly googleClient = new OAuth2Client();

  /** Accepted audiences for Google ID tokens (web + iOS OAuth client IDs). */
  private googleAudiences(): string[] {
    return [
      this.config.get<string>('GOOGLE_CLIENT_ID_WEB'),
      this.config.get<string>('GOOGLE_CLIENT_ID_IOS'),
    ].filter((id): id is string => !!id);
  }

  /** Rejects a language code that isn't a connected language in the catalog. */
  private async assertSelectableLanguage(code: string | undefined): Promise<void> {
    if (!code) return;
    if (!(await this.languagesService.isSelectable(code))) {
      throw new BadRequestException('Selected language is not available');
    }
  }

  async signup(dto: SignupDto): Promise<{ email: string }> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    await this.assertSelectableLanguage(dto.language);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verification = this.createEmailVerification();
    await this.pendingSignups.upsert({
      email,
      passwordHash,
      displayName: dto.displayName,
      language: (dto.language ?? null) as LanguageCode | null,
      level: dto.level ?? null,
      learningReason: dto.reason ?? null,
      country: dto.country ?? null,
      code: verification.code,
      expiresAt: verification.expiresAt,
    });
    await this.email.sendVerificationEmail({
      email,
      displayName: dto.displayName,
      code: verification.code,
    });
    return { email };
  }

  /**
   * Issues a session for an already-authenticated/verified user. Used to
   * auto-login an invitee right after they accept an admin invitation.
   */
  async issueSession(user: User): Promise<AuthResponse> {
    await this.users.touchActivity(user.id);
    user.lastActiveAt = new Date();
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new ForbiddenException(
        'Account temporarily locked due to too many failed attempts. Try again later.',
      );
    }

    // Social-only accounts (Google) have no local password.
    if (!user.passwordHash) {
      throw new UnauthorizedException('Use Google sign-in for this account');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      const { maxFailedLoginAttempts } = await this.platformSettings.getCached();
      const attempts = (user.failedLoginAttempts ?? 0) + 1;
      if (attempts >= maxFailedLoginAttempts) {
        await this.users.update(user.id, {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + LOCKOUT_MS),
        });
      } else {
        await this.users.update(user.id, { failedLoginAttempts: attempts });
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email is not verified');
    }

    // Successful login — clear any failed-attempt state.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.users.update(user.id, { failedLoginAttempts: 0, lockedUntil: null });
    }
    await this.users.touchActivity(user.id);
    user.lastActiveAt = new Date();
    return this.toAuthResponse(user);
  }

  /**
   * Verifies a Google ID token, then finds or creates the matching user and
   * issues our own JWT session. New accounts come back with `isNewUser: true`
   * so the client can route them through onboarding.
   */
  async googleAuth(idToken: string): Promise<GoogleAuthResponse> {
    const audience = this.googleAudiences();
    if (audience.length === 0) {
      throw new BadRequestException('Google sign-in is not configured');
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new UnauthorizedException('Google account is missing a verified email');
    }

    const email = payload.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      // Link the Google identity on first social sign-in for an email account.
      if (!existing.googleId) {
        await this.users.update(existing.id, { googleId: payload.sub });
        existing.googleId = payload.sub;
      }
      const session = await this.issueSession(existing);
      return { ...session, isNewUser: false };
    }

    const created = await this.users.create({
      email,
      displayName: payload.name ?? email.split('@')[0],
      googleId: payload.sub,
      avatarUrl: payload.picture ?? null,
      passwordHash: null,
      emailVerifiedAt: new Date(),
    });
    const session = await this.issueSession(created);
    return { ...session, isNewUser: true };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();
    const pending = await this.pendingSignups.findByEmailAndCode(email, dto.code);
    if (!pending || pending.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      await this.pendingSignups.deleteById(pending.id);
      throw new ConflictException('Email already in use');
    }

    const user = await this.dataSource.transaction(async (manager) => {
      const created = await this.users.create({
        email: pending.email,
        displayName: pending.displayName,
        passwordHash: pending.passwordHash,
        language: pending.language,
        level: pending.level,
        learningReason: pending.learningReason,
        country: pending.country,
        emailVerifiedAt: new Date(),
      });
      await manager.delete(PendingSignup, { id: pending.id });
      return created;
    });

    await this.email.sendWelcomeEmail({ email: user.email, displayName: user.displayName });

    return this.toAuthResponse(user);
  }

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    const email = dto.email.toLowerCase();
    const pending = await this.pendingSignups.findByEmail(email);
    if (!pending) return;
    const verification = this.createEmailVerification();
    pending.code = verification.code;
    pending.expiresAt = verification.expiresAt;
    await this.pendingSignups.save(pending);
    await this.email.sendVerificationEmail({
      email: pending.email,
      displayName: pending.displayName,
      code: verification.code,
    });
  }

  async changePendingEmail(dto: ChangePendingEmailDto): Promise<{ email: string }> {
    const currentEmail = dto.currentEmail.toLowerCase();
    const newEmail = dto.newEmail.toLowerCase();
    if (currentEmail === newEmail) {
      throw new BadRequestException('New email must be different');
    }
    const pending = await this.pendingSignups.findByEmail(currentEmail);
    if (!pending) {
      throw new BadRequestException('No pending signup found for that email');
    }
    if (!(await bcrypt.compare(dto.password, pending.passwordHash))) {
      throw new UnauthorizedException('Incorrect password');
    }
    const existingUser = await this.users.findByEmail(newEmail);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    const existingPending = await this.pendingSignups.findByEmail(newEmail);
    if (existingPending && existingPending.id !== pending.id) {
      throw new ConflictException('Email already in use');
    }

    const verification = this.createEmailVerification();
    pending.email = newEmail;
    pending.code = verification.code;
    pending.expiresAt = verification.expiresAt;
    await this.pendingSignups.save(pending);
    await this.email.sendVerificationEmail({
      email: newEmail,
      displayName: pending.displayName,
      code: verification.code,
    });
    return { email: newEmail };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    // Always return without revealing whether the account exists.
    if (!user) {
      return;
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);
    await this.users.update(user.id, {
      passwordResetToken: code,
      passwordResetExpiresAt: expiresAt,
    });
    await this.email.sendPasswordResetEmail({
      email: user.email,
      displayName: user.displayName,
      code,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    if (
      !user ||
      !user.passwordResetToken ||
      user.passwordResetToken !== dto.code ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset code');
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
    if (!user.passwordHash) {
      throw new BadRequestException('This account has no password. It was created with Google.');
    }
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
      user.emailVerifiedAt = null;
    }
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.language !== undefined) {
      await this.assertSelectableLanguage(dto.language);
      user.language = dto.language as LanguageCode;
    }
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
      xp: user.xp,
      currentStreakDays: user.currentStreakDays,
      lessonsCompleted: user.lessonsCompleted,
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
        language: user.language,
        level: user.level,
        learningReason: user.learningReason,
        xp: user.xp,
        currentStreakDays: user.currentStreakDays,
        lessonsCompleted: user.lessonsCompleted,
      },
    };
  }

  private createEmailVerification(): { code: string; expiresAt: Date } {
    return {
      code: randomInt(0, 1_000_000).toString().padStart(6, '0'),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    };
  }
}
