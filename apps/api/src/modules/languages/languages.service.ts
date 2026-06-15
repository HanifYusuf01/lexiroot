import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { TeachingLanguage } from '@lexiroot/shared';
import { Language } from './entities/language.entity';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private readonly languages: Repository<Language>,
  ) {}

  async list(): Promise<TeachingLanguage[]> {
    const [languages, learnerRows, lessonRows] = await Promise.all([
      this.languages.find({ order: { createdAt: 'ASC' } }),
      this.languages.manager.query(
        `SELECT "language" AS code, COUNT(*)::int AS count FROM "users" WHERE "language" IS NOT NULL GROUP BY "language"`,
      ),
      this.languages.manager.query(
        `SELECT "language" AS code, COUNT(*)::int AS count FROM "lessons" GROUP BY "language"`,
      ),
    ]);

    const learnersByCode = countMap(learnerRows);
    const lessonsByCode = countMap(lessonRows);

    return languages.map((language) => this.toDto(language, learnersByCode, lessonsByCode));
  }

  async create(dto: CreateLanguageDto): Promise<TeachingLanguage> {
    const code = dto.code.toLowerCase();
    const existing = await this.languages.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Language "${code}" already exists`);
    }
    const language = await this.languages.save(
      this.languages.create({
        code,
        name: dto.name.trim(),
        country: dto.country.toUpperCase(),
        status: dto.status ?? 'draft',
      }),
    );
    return this.toDto(language, {}, {});
  }

  async update(id: string, dto: UpdateLanguageDto): Promise<TeachingLanguage> {
    const language = await this.languages.findOne({ where: { id } });
    if (!language) throw new NotFoundException('Language not found');

    if (dto.code && dto.code.toLowerCase() !== language.code) {
      const code = dto.code.toLowerCase();
      const clash = await this.languages.findOne({ where: { code } });
      if (clash) throw new ConflictException(`Language "${code}" already exists`);
      language.code = code;
    }
    if (dto.name !== undefined) language.name = dto.name.trim();
    if (dto.country !== undefined) language.country = dto.country.toUpperCase();
    if (dto.status !== undefined) language.status = dto.status;

    const saved = await this.languages.save(language);
    return this.list().then((all) => all.find((l) => l.id === saved.id) ?? this.toDto(saved, {}, {}));
  }

  async remove(id: string): Promise<void> {
    const result = await this.languages.delete(id);
    if (!result.affected) throw new NotFoundException('Language not found');
  }

  private toDto(
    language: Language,
    learnersByCode: Record<string, number>,
    lessonsByCode: Record<string, number>,
  ): TeachingLanguage {
    return {
      id: language.id,
      code: language.code,
      name: language.name,
      country: language.country,
      status: language.status,
      learners: learnersByCode[language.code] ?? 0,
      lessons: lessonsByCode[language.code] ?? 0,
      createdAt: language.createdAt.toISOString(),
      updatedAt: language.updatedAt.toISOString(),
    };
  }
}

function countMap(rows: { code: string; count: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) out[row.code] = Number(row.count);
  return out;
}
