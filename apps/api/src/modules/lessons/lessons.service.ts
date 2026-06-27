import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LessonMeta, LessonStatus } from '@lexiroot/shared';
import { LESSON_TYPE_LABELS } from '@lexiroot/shared';
import { Lesson } from './entities/lesson.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ListLessonsQueryDto } from './dto/list-lessons-query.dto';

export interface LessonRow {
  id: string;
  language: Lesson['language'];
  tier: Lesson['tier'];
  level: number;
  title: string;
  slug: string;
  shortDescription: string;
  estimatedDuration: Lesson['estimatedDuration'];
  xpReward: number;
  orderInUnit: number;
  type: Lesson['type'];
  speechRequired: boolean;
  offlineAvailable: boolean;
  status: LessonStatus;
  meta: LessonMeta;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedLessons {
  items: LessonRow[];
  page: number;
  limit: number;
  total: number;
}

export interface LessonStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  newThisMonth: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220);
}

function toRow(lesson: Lesson): LessonRow {
  return {
    id: lesson.id,
    language: lesson.language,
    tier: lesson.tier,
    level: lesson.level,
    title: lesson.title,
    slug: lesson.slug,
    shortDescription: lesson.shortDescription,
    estimatedDuration: lesson.estimatedDuration,
    xpReward: lesson.xpReward,
    orderInUnit: lesson.orderInUnit,
    type: lesson.type,
    speechRequired: lesson.speechRequired,
    offlineAvailable: lesson.offlineAvailable,
    status: lesson.status,
    meta: lesson.meta ?? {},
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessons: Repository<Lesson>,
  ) {}

  async paginate(query: ListLessonsQueryDto): Promise<PaginatedLessons> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.lessons.createQueryBuilder('lesson');

    if (query.search) {
      qb.andWhere(
        '(LOWER(lesson.title) LIKE :s OR LOWER(lesson.short_description) LIKE :s)',
        { s: `%${query.search.toLowerCase()}%` },
      );
    }
    if (query.language) qb.andWhere('lesson.language = :language', { language: query.language });
    if (query.tier) qb.andWhere('lesson.tier = :tier', { tier: query.tier });
    if (query.level) qb.andWhere('lesson.level = :level', { level: query.level });
    if (query.status) qb.andWhere('lesson.status = :status', { status: query.status });
    if (query.type) qb.andWhere('lesson.type = :type', { type: query.type });

    const [rows, total] = await qb
      .orderBy('lesson.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: rows.map(toRow), page, limit, total };
  }

  async stats(): Promise<LessonStats> {
    const [total, published, drafts, archived, newThisMonth] = await Promise.all([
      this.lessons.count(),
      this.lessons.count({ where: { status: 'published' } }),
      this.lessons.count({ where: { status: 'draft' } }),
      this.lessons.count({ where: { status: 'archived' } }),
      this.lessons
        .createQueryBuilder('lesson')
        .where("lesson.created_at >= date_trunc('month', now())")
        .getCount(),
    ]);
    return { total, published, drafts, archived, newThisMonth };
  }

  async getById(id: string): Promise<LessonRow> {
    const lesson = await this.lessons.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return toRow(lesson);
  }

  async create(dto: CreateLessonDto, createdById: string | null): Promise<LessonRow> {
    await this.assertNoTypeClash(dto.language, dto.tier, dto.level, dto.type);
    const slug = await this.uniqueSlug(slugify(dto.title));
    const lesson = this.lessons.create({
      language: dto.language,
      tier: dto.tier,
      level: dto.level,
      title: dto.title,
      slug,
      shortDescription: dto.shortDescription ?? '',
      estimatedDuration: dto.estimatedDuration ?? null,
      xpReward: dto.xpReward ?? 0,
      orderInUnit: dto.orderInUnit ?? 0,
      type: dto.type,
      speechRequired: dto.speechRequired ?? false,
      offlineAvailable: dto.offlineAvailable ?? true,
      status: dto.status ?? 'draft',
      meta: dto.meta ?? {},
      createdById,
    });
    const saved = await this.lessons.save(lesson);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateLessonDto): Promise<LessonRow> {
    const lesson = await this.lessons.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (dto.title !== undefined && dto.title !== lesson.title) {
      lesson.title = dto.title;
      lesson.slug = await this.uniqueSlug(slugify(dto.title), lesson.id);
    }
    // Re-check the (language, tier, level, type) slot whenever any of those
    // change — the curriculum allows only one lesson per type at a given level.
    if (
      dto.language !== undefined ||
      dto.tier !== undefined ||
      dto.level !== undefined ||
      dto.type !== undefined
    ) {
      await this.assertNoTypeClash(
        dto.language ?? lesson.language,
        dto.tier ?? lesson.tier,
        dto.level ?? lesson.level,
        dto.type ?? lesson.type,
        lesson.id,
      );
    }

    if (dto.language !== undefined) lesson.language = dto.language;
    if (dto.tier !== undefined) lesson.tier = dto.tier;
    if (dto.level !== undefined) lesson.level = dto.level;
    if (dto.shortDescription !== undefined) lesson.shortDescription = dto.shortDescription;
    if (dto.estimatedDuration !== undefined) lesson.estimatedDuration = dto.estimatedDuration;
    if (dto.xpReward !== undefined) lesson.xpReward = dto.xpReward;
    if (dto.orderInUnit !== undefined) lesson.orderInUnit = dto.orderInUnit;
    if (dto.type !== undefined) lesson.type = dto.type;
    if (dto.speechRequired !== undefined) lesson.speechRequired = dto.speechRequired;
    if (dto.offlineAvailable !== undefined) lesson.offlineAvailable = dto.offlineAvailable;
    if (dto.status !== undefined) lesson.status = dto.status;
    if (dto.meta !== undefined) lesson.meta = dto.meta;

    await this.lessons.save(lesson);
    return this.getById(lesson.id);
  }

  async archive(id: string): Promise<LessonRow> {
    return this.update(id, { status: 'archived' });
  }

  // The mobile curriculum groups sub-lessons by (tier, level) and expects at
  // most one lesson of each type per slot — two e.g. Vocabulary lessons at the
  // same tier/level would both show up in a single level run. Guard against it.
  private async assertNoTypeClash(
    language: Lesson['language'],
    tier: Lesson['tier'],
    level: number,
    type: Lesson['type'],
    excludeId?: string,
  ): Promise<void> {
    const clash = await this.lessons.findOne({
      where: { language, tier, level, type },
    });
    if (clash && clash.id !== excludeId) {
      throw new ConflictException(
        `A ${LESSON_TYPE_LABELS[type]} lesson already exists for ${tier} level ${level}. ` +
          'Each tier and level can only have one lesson per type.',
      );
    }
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    if (!base) throw new ConflictException('Cannot generate slug from title');
    let candidate = base;
    let counter = 1;
    while (true) {
      const existing = await this.lessons.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      counter += 1;
      candidate = `${base}-${counter}`.slice(0, 220);
      if (counter > 1000) throw new ConflictException('Could not generate unique slug');
    }
  }
}
