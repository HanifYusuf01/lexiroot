import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import type { CountryCode } from '@lexiroot/shared';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateMeDto } from './dto/update-me.dto';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    emailVerifiedAt: Date | null;
    country: CountryCode | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash,
      language: dto.language ?? null,
      level: dto.level ?? null,
      learningReason: dto.reason ?? null,
      country: dto.country ?? null,
      phone: dto.phone ?? null,
    });
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.users.touchActivity(user.id);
    user.lastActiveAt = new Date();
    return this.toAuthResponse(user);
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
      // Email change invalidates verification — re-verify on the new address.
      user.emailVerifiedAt = null;
    }
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.language !== undefined) user.language = dto.language;
    if (dto.level !== undefined) user.level = dto.level;
    if (dto.reason !== undefined) user.learningReason = dto.reason;
    if (dto.country !== undefined) user.country = dto.country;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.users.update(user.id, {
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt,
      language: user.language,
      level: user.level,
      learningReason: user.learningReason,
      country: user.country,
      phone: user.phone,
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
      phone: user.phone,
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
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
