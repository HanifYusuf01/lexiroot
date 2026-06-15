import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly pendingSignups: PendingSignupsService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async signup(dto: SignupDto): Promise<{ email: string }> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verification = this.createEmailVerification();
    await this.pendingSignups.upsert({
      email,
      passwordHash,
      displayName: dto.displayName,
      language: dto.language ?? null,
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
