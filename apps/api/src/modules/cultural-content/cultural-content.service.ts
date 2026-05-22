import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CulturalContentBody, CulturalContentType } from '@lexiroot/shared';
import { CulturalContent } from './entities/cultural-content.entity';
import { CreateCulturalContentDto } from './dto/create-cultural-content.dto';
import { UpdateCulturalContentDto } from './dto/update-cultural-content.dto';
import { ListCulturalContentQueryDto } from './dto/list-cultural-content-query.dto';

export interface CulturalContentRow {
  id: string;
  type: CulturalContent['type'];
  language: CulturalContent['language'];
  tier: CulturalContent['tier'];
  titleEnglish: string;
  titleTranslated: string;
  shortDescription: string;
  body: CulturalContentBody;
  coverImageUrl: string | null;
  audioUrl: string | null;
  audioFileName: string | null;
  status: CulturalContent['status'];
  views: number;
  publishedAt: Date | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedCulturalContent {
  items: CulturalContentRow[];
  page: number;
  limit: number;
  total: number;
}

export interface CulturalContentStats {
  total: number;
  folktales: number;
  proverbs: number;
  stories: number;
  mediaFiles: number;
  newThisMonth: number;
  newFolktalesThisMonth: number;
  newProverbsThisMonth: number;
  newStoriesThisMonth: number;
  newMediaFilesThisMonth: number;
}

function toRow(c: CulturalContent): CulturalContentRow {
  return {
    id: c.id,
    type: c.type,
    language: c.language,
    tier: c.tier,
    titleEnglish: c.titleEnglish,
    titleTranslated: c.titleTranslated,
    shortDescription: c.shortDescription,
    body: c.body ?? ({} as CulturalContentBody),
    coverImageUrl: c.coverImageUrl,
    audioUrl: c.audioUrl,
    audioFileName: c.audioFileName,
    status: c.status,
    views: c.views,
    publishedAt: c.publishedAt,
    createdById: c.createdById,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

@Injectable()
export class CulturalContentService {
  constructor(
    @InjectRepository(CulturalContent)
    private readonly repo: Repository<CulturalContent>,
  ) {}

  async paginate(query: ListCulturalContentQueryDto): Promise<PaginatedCulturalContent> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.repo.createQueryBuilder('c');

    if (query.search) {
      qb.andWhere(
        '(LOWER(c.title_english) LIKE :s OR LOWER(c.title_translated) LIKE :s OR LOWER(c.short_description) LIKE :s)',
        { s: `%${query.search.toLowerCase()}%` },
      );
    }
    if (query.type) qb.andWhere('c.type = :type', { type: query.type });
    if (query.language) qb.andWhere('c.language = :language', { language: query.language });
    if (query.tier) qb.andWhere('c.tier = :tier', { tier: query.tier });
    if (query.status) qb.andWhere('c.status = :status', { status: query.status });

    const [rows, total] = await qb
      .orderBy('c.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items: rows.map(toRow), page, limit, total };
  }

  async stats(): Promise<CulturalContentStats> {
    const monthStart = "date_trunc('month', now())";
    const [
      total,
      folktales,
      proverbs,
      stories,
      mediaFiles,
      newThisMonth,
      newFolktalesThisMonth,
      newProverbsThisMonth,
      newStoriesThisMonth,
      newMediaFilesThisMonth,
    ] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { type: 'folktale' } }),
      this.repo.count({ where: { type: 'proverb' } }),
      this.repo.count({ where: { type: 'story' } }),
      this.repo
        .createQueryBuilder('c')
        .where('c.cover_image_url IS NOT NULL OR c.audio_url IS NOT NULL')
        .getCount(),
      this.repo.createQueryBuilder('c').where(`c.created_at >= ${monthStart}`).getCount(),
      this.repo
        .createQueryBuilder('c')
        .where('c.type = :type', { type: 'folktale' })
        .andWhere(`c.created_at >= ${monthStart}`)
        .getCount(),
      this.repo
        .createQueryBuilder('c')
        .where('c.type = :type', { type: 'proverb' })
        .andWhere(`c.created_at >= ${monthStart}`)
        .getCount(),
      this.repo
        .createQueryBuilder('c')
        .where('c.type = :type', { type: 'story' })
        .andWhere(`c.created_at >= ${monthStart}`)
        .getCount(),
      this.repo
        .createQueryBuilder('c')
        .where('(c.cover_image_url IS NOT NULL OR c.audio_url IS NOT NULL)')
        .andWhere(`c.created_at >= ${monthStart}`)
        .getCount(),
    ]);

    return {
      total,
      folktales,
      proverbs,
      stories,
      mediaFiles,
      newThisMonth,
      newFolktalesThisMonth,
      newProverbsThisMonth,
      newStoriesThisMonth,
      newMediaFilesThisMonth,
    };
  }

  async getById(id: string): Promise<CulturalContentRow> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Cultural content not found');
    return toRow(c);
  }

  async create(
    dto: CreateCulturalContentDto,
    createdById: string | null,
  ): Promise<CulturalContentRow> {
    const status = dto.status ?? 'draft';
    const entity = this.repo.create({
      type: dto.type,
      language: dto.language,
      tier: dto.tier ?? 'beginner',
      titleEnglish: dto.titleEnglish,
      titleTranslated: dto.titleTranslated ?? '',
      shortDescription: dto.shortDescription ?? '',
      body: defaultBody(dto.type, dto.body),
      coverImageUrl: dto.coverImageUrl ?? null,
      audioUrl: dto.audioUrl ?? null,
      audioFileName: dto.audioFileName ?? null,
      status,
      views: dto.views ?? 0,
      publishedAt: status === 'published' ? new Date() : null,
      createdById,
    });
    const saved = await this.repo.save(entity);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateCulturalContentDto): Promise<CulturalContentRow> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Cultural content not found');

    if (dto.type !== undefined) c.type = dto.type;
    if (dto.language !== undefined) c.language = dto.language;
    if (dto.tier !== undefined) c.tier = dto.tier;
    if (dto.titleEnglish !== undefined) c.titleEnglish = dto.titleEnglish;
    if (dto.titleTranslated !== undefined) c.titleTranslated = dto.titleTranslated;
    if (dto.shortDescription !== undefined) c.shortDescription = dto.shortDescription;
    if (dto.body !== undefined) c.body = defaultBody(c.type, dto.body);
    if (dto.coverImageUrl !== undefined) c.coverImageUrl = dto.coverImageUrl ?? null;
    if (dto.audioUrl !== undefined) c.audioUrl = dto.audioUrl ?? null;
    if (dto.audioFileName !== undefined) c.audioFileName = dto.audioFileName ?? null;
    if (dto.views !== undefined) c.views = dto.views;
    if (dto.status !== undefined) {
      if (dto.status === 'published' && c.status !== 'published') {
        c.publishedAt = new Date();
      }
      c.status = dto.status;
    }

    await this.repo.save(c);
    return this.getById(c.id);
  }

  async archive(id: string): Promise<CulturalContentRow> {
    return this.update(id, { status: 'archived' });
  }
}

function defaultBody(type: CulturalContentType, body: CulturalContentBody): CulturalContentBody {
  if (type === 'proverb') {
    const b = body as Partial<{ explanation: string; usageExample: string }>;
    return {
      explanation: b.explanation ?? '',
      usageExample: b.usageExample ?? '',
    };
  }
  const b = body as Partial<{ contentEnglish: string; contentTranslated: string }>;
  return {
    contentEnglish: b.contentEnglish ?? '',
    contentTranslated: b.contentTranslated ?? '',
  };
}
