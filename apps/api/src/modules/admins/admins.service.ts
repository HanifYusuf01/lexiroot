import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type {
  AdminAccount,
  AdminInvitation as AdminInvitationDto,
  AdminInvitationPreview,
  AdminInvitationStatus,
  AdminRole,
  CountryCode,
} from '@lexiroot/shared';
import { AuthResponse, AuthService } from '../auth/auth.service';
import { EmailService } from '../auth/email.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AdminInvitation } from './entities/admin-invitation.entity';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { AcceptAdminInvitationDto } from './dto/accept-admin-invitation.dto';

const BCRYPT_ROUNDS = 12;
const INVITE_TOKEN_BYTES = 32;
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(AdminInvitation)
    private readonly invitations: Repository<AdminInvitation>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly usersService: UsersService,
    private readonly auth: AuthService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async listAdmins(): Promise<AdminAccount[]> {
    const rows = await this.users.find({
      where: [{ role: 'admin' }, { role: 'instructor' }],
      order: { createdAt: 'DESC' },
    });
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role as AdminRole,
      avatarUrl: u.avatarUrl,
      lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async updateAdminRole(id: string, role: AdminRole): Promise<AdminAccount> {
    const user = await this.users.findOne({ where: { id } });
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      throw new NotFoundException('Admin not found');
    }
    user.role = role;
    await this.users.save(user);
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role as AdminRole,
      avatarUrl: user.avatarUrl,
      lastActiveAt: user.lastActiveAt ? user.lastActiveAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async removeAdmin(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new BadRequestException('You cannot remove your own account');
    }
    const user = await this.users.findOne({ where: { id } });
    if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
      throw new NotFoundException('Admin not found');
    }
    await this.users.delete(id);
  }

  async listInvitations(): Promise<AdminInvitationDto[]> {
    const rows = await this.invitations.find({ order: { createdAt: 'DESC' } });
    return rows.map((row) => this.toInvitationDto(row));
  }

  async createInvitation(
    dto: CreateAdminInvitationDto,
    inviter: User,
  ): Promise<AdminInvitationDto> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('A user with that email already exists');
    }

    // Replace any earlier, not-yet-accepted invitation for the same email.
    await this.invitations.delete({ email, acceptedAt: IsNull() });

    const invitation = this.invitations.create({
      email,
      displayName: dto.displayName,
      role: dto.role,
      country: dto.country ?? null,
      token: this.generateToken(),
      invitedById: inviter.id,
      invitedByName: inviter.displayName,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      acceptedAt: null,
    });
    const saved = await this.invitations.save(invitation);
    await this.sendInvitationEmail(saved);
    return this.toInvitationDto(saved);
  }

  async resendInvitation(id: string): Promise<AdminInvitationDto> {
    const invitation = await this.invitations.findOne({ where: { id } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }
    invitation.token = this.generateToken();
    invitation.expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const saved = await this.invitations.save(invitation);
    await this.sendInvitationEmail(saved);
    return this.toInvitationDto(saved);
  }

  async revokeInvitation(id: string): Promise<void> {
    const invitation = await this.invitations.findOne({ where: { id } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }
    await this.invitations.delete(id);
  }

  async previewInvitation(token: string): Promise<AdminInvitationPreview> {
    const invitation = await this.invitations.findOne({ where: { token } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    return {
      email: invitation.email,
      displayName: invitation.displayName,
      role: invitation.role,
      country: invitation.country,
      status: this.statusOf(invitation),
    };
  }

  async acceptInvitation(dto: AcceptAdminInvitationDto): Promise<AuthResponse> {
    const invitation = await this.invitations.findOne({ where: { token: dto.token } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) {
      throw new BadRequestException('This invitation has already been used');
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invitation has expired');
    }

    const existingUser = await this.usersService.findByEmail(invitation.email);
    if (existingUser) {
      throw new ConflictException('A user with that email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.dataSource.transaction(async (manager) => {
      const created = await this.usersService.create({
        email: invitation.email,
        displayName: invitation.displayName,
        passwordHash,
        role: invitation.role,
        country: (invitation.country as CountryCode | null) ?? null,
        emailVerifiedAt: new Date(),
      });
      invitation.acceptedAt = new Date();
      await manager.save(invitation);
      return created;
    });

    return this.auth.issueSession(user);
  }

  private async sendInvitationEmail(invitation: AdminInvitation): Promise<void> {
    const baseUrl = this.config.get<string>('ADMIN_URL') ?? 'http://localhost:5173';
    const inviteUrl = `${baseUrl.replace(/\/$/, '')}/register?token=${invitation.token}`;
    await this.email.sendAdminInvitationEmail({
      email: invitation.email,
      displayName: invitation.displayName,
      role: invitation.role,
      inviteUrl,
    });
  }

  private generateToken(): string {
    return randomBytes(INVITE_TOKEN_BYTES).toString('hex');
  }

  private statusOf(invitation: AdminInvitation): AdminInvitationStatus {
    if (invitation.acceptedAt) return 'accepted';
    if (invitation.expiresAt.getTime() < Date.now()) return 'expired';
    return 'pending';
  }

  private toInvitationDto(invitation: AdminInvitation): AdminInvitationDto {
    return {
      id: invitation.id,
      email: invitation.email,
      displayName: invitation.displayName,
      role: invitation.role,
      country: invitation.country,
      status: this.statusOf(invitation),
      invitedByName: invitation.invitedByName,
      expiresAt: invitation.expiresAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : null,
      createdAt: invitation.createdAt.toISOString(),
    };
  }
}
