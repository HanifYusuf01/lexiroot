import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type {
  CountryCode,
  LanguageCode,
  LearningLevel,
  LearningReason,
} from '@lexiroot/shared';
import { PendingSignup } from './entities/pending-signup.entity';

interface UpsertPendingSignupInput {
  email: string;
  passwordHash: string;
  displayName: string;
  language?: LanguageCode | null;
  level?: LearningLevel | null;
  learningReason?: LearningReason | null;
  country?: CountryCode | null;
  code: string;
  expiresAt: Date;
}

@Injectable()
export class PendingSignupsService {
  constructor(
    @InjectRepository(PendingSignup)
    private readonly pending: Repository<PendingSignup>,
  ) {}

  findByEmail(email: string): Promise<PendingSignup | null> {
    return this.pending.findOne({ where: { email: email.toLowerCase() } });
  }

  findByEmailAndCode(email: string, code: string): Promise<PendingSignup | null> {
    return this.pending.findOne({ where: { email: email.toLowerCase(), code } });
  }

  async upsert(data: UpsertPendingSignupInput): Promise<PendingSignup> {
    const email = data.email.toLowerCase();
    const existing = await this.pending.findOne({ where: { email } });
    if (existing) {
      existing.passwordHash = data.passwordHash;
      existing.displayName = data.displayName;
      existing.language = data.language ?? null;
      existing.level = data.level ?? null;
      existing.learningReason = data.learningReason ?? null;
      existing.country = data.country ?? null;
      existing.code = data.code;
      existing.expiresAt = data.expiresAt;
      return this.pending.save(existing);
    }
    const row = this.pending.create({
      email,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      language: data.language ?? null,
      level: data.level ?? null,
      learningReason: data.learningReason ?? null,
      country: data.country ?? null,
      code: data.code,
      expiresAt: data.expiresAt,
    });
    return this.pending.save(row);
  }

  save(row: PendingSignup): Promise<PendingSignup> {
    return this.pending.save(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.pending.delete(id);
  }

  async deleteExpired(): Promise<number> {
    const result = await this.pending.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
