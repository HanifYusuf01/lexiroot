import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { LessonMeta, LessonStatus } from '@lexiroot/shared';
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
