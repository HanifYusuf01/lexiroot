import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACTIVE_WINDOW_DAYS,
  type CountryCode,
  type LanguageCode,
  type LearningLevel,
  type LearningReason,
} from '@lexiroot/shared';
import { User, UserRole } from './entities/user.entity';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: UserRole;
  language?: LanguageCode | null;
  level?: LearningLevel | null;
  learningReason?: LearningReason | null;
  country?: CountryCode | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  emailVerifiedAt: Date | null;
  language: LanguageCode | null;
  level: LearningLevel | null;
  learningReason: LearningReason | null;
  country: CountryCode | null;
  avatarUrl: string | null;
  xp: number;
  currentStreakDays: number;
  lessonsCompleted: number;
  lastActiveAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface PaginatedUsers {
  items: PublicUser[];
  page: number;
  limit: number;
  total: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

function activeCutoff(): Date {
  const d = new Date();
  d.setDate(d.getDate() - ACTIVE_WINDOW_DAYS);
  return d;
}

function isActive(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return lastActiveAt.getTime() >= activeCutoff().getTime();
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isPrevUtcDay(prev: Date, today: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff =
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate());
  return diff === oneDayMs;
}

function toPublic(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    emailVerifiedAt: u.emailVerifiedAt,
    language: u.language,
    level: u.level,
    learningReason: u.learningReason,
    country: u.country,
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    currentStreakDays: u.currentStreakDays,
    lessonsCompleted: u.lessonsCompleted,
    lastActiveAt: u.lastActiveAt,
    isActive: isActive(u.lastActiveAt),
    createdAt: u.createdAt,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByPasswordResetToken(token: string): Promise<User | null> {
    return this.users.findOne({ where: { passwordResetToken: token } });
  }

  create(data: CreateUserInput): Promise<User> {
    const user = this.users.create({
      email: data.email.toLowerCase(),
      displayName: data.displayName,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
      language: data.language ?? null,
      level: data.level ?? null,
      learningReason: data.learningReason ?? null,
      country: data.country ?? null,
      emailVerifiedAt: data.emailVerifiedAt ?? null,
      lastActiveAt: new Date(),
    });
    return this.users.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await this.users.update(id, data);
  }

  async touchActivity(id: string): Promise<void> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) return;
    const now = new Date();
    const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    let streak = user.currentStreakDays ?? 0;
    if (!last) {
      streak = 1;
    } else if (isSameUtcDay(last, now)) {
      // Already counted today. A brand-new account is created with
      // lastActiveAt=now and streak=0, so promote to 1 the first time the
      // user actually pings any endpoint.
      if (streak === 0) streak = 1;
    } else if (isPrevUtcDay(last, now)) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
    await this.users.update(id, { lastActiveAt: now, currentStreakDays: streak });

    // Record today's active day (UTC) for DAU/WAU/MAU analytics. Idempotent —
    // at most one row per user per day.
    await this.users.manager.query(
      `INSERT INTO "user_active_days" ("user_id", "day")
       VALUES ($1, (now() AT TIME ZONE 'UTC')::date)
       ON CONFLICT DO NOTHING`,
      [id],
    );
  }

  async paginate(query: ListUsersQueryDto): Promise<PaginatedUsers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const cutoff = activeCutoff();
    const qb = this.users.createQueryBuilder('user');
    // The Users page is the learner roster — staff (admin/instructor) are
    // managed separately, so never list them here.
    qb.where("user.role = 'user'");
    if (query.search) {
      qb.andWhere('(LOWER(user.email) LIKE :s OR LOWER(user.display_name) LIKE :s)', {
        s: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.status === 'active') {
      qb.andWhere('user.last_active_at IS NOT NULL AND user.last_active_at >= :cutoff', {
        cutoff,
      });
    } else if (query.status === 'inactive') {
      qb.andWhere('(user.last_active_at IS NULL OR user.last_active_at < :cutoff)', {
        cutoff,
      });
    }
    const [rows, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: rows.map(toPublic),
      page,
      limit,
      total,
    };
  }

  async stats(): Promise<UserStats> {
    const cutoff = activeCutoff();
    const [total, active] = await Promise.all([
      this.users.count({ where: { role: 'user' } }),
      this.users
        .createQueryBuilder('user')
        .where("user.role = 'user'")
        .andWhere('user.last_active_at IS NOT NULL AND user.last_active_at >= :cutoff', { cutoff })
        .getCount(),
    ]);
    return { total, active, inactive: total - active };
  }

  async getPublicById(id: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toPublic(user);
  }

  async adminUpdate(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.displayName !== undefined) user.displayName = dto.displayName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.emailVerified !== undefined) {
      user.emailVerifiedAt = dto.emailVerified ? (user.emailVerifiedAt ?? new Date()) : null;
    }
    if (dto.language !== undefined) user.language = dto.language;
    if (dto.level !== undefined) user.level = dto.level;
    await this.users.save(user);
    return toPublic(user);
  }

  async remove(id: string): Promise<void> {
    const result = await this.users.delete(id);
    if (!result.affected) throw new NotFoundException('User not found');
  }
}
