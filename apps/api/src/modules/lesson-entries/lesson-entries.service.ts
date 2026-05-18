import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { LessonEntryKind } from '@lexiroot/shared';
import { LessonEntry } from './entities/lesson-entry.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { ReplaceLessonEntriesDto } from './dto/replace-lesson-entries.dto';

export interface LessonEntryRow {
  id: string;
  lessonId: string;
  kind: LessonEntryKind;
  orderIndex: number;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

function toRow(entry: LessonEntry): LessonEntryRow {
  return {
    id: entry.id,
    lessonId: entry.lessonId,
    kind: entry.kind,
    orderIndex: entry.orderIndex,
    payload: entry.payload,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function isStr(v: unknown): v is string {
  return typeof v === 'string';
}

function validatePayload(kind: LessonEntryKind, payload: Record<string, unknown>): void {
  if (kind === 'vocabulary') {
    if (!isStr(payload.word) || !isStr(payload.meaning)) {
      throw new BadRequestException('Vocabulary entry needs word and meaning');
    }
    if (typeof payload.audioUrl !== 'string') {
      throw new BadRequestException('Vocabulary entry audioUrl must be a string');
    }
    if (typeof payload.exampleSentence !== 'string') {
      throw new BadRequestException('Vocabulary entry exampleSentence must be a string');
    }
  } else if (kind === 'sentence') {
    if (!isStr(payload.sentence) || !isStr(payload.meaning)) {
      throw new BadRequestException('Sentence entry needs sentence and meaning');
    }
    if (typeof payload.audioUrl !== 'string') {
      throw new BadRequestException('Sentence entry audioUrl must be a string');
    }
  } else if (kind === 'letter') {
    if (!isStr(payload.letter) || typeof payload.audioUrl !== 'string') {
      throw new BadRequestException('Letter entry needs letter and audioUrl');
    }
  } else if (kind === 'number') {
    if (!isStr(payload.value) || !isStr(payload.translation)) {
      throw new BadRequestException('Number entry needs value and translation');
    }
    if (typeof payload.audioUrl !== 'string') {
      throw new BadRequestException('Number entry audioUrl must be a string');
    }
  } else if (kind === 'recognition-item') {
    if (!isStr(payload.word) || typeof payload.imageUrl !== 'string') {
      throw new BadRequestException('Recognition item needs word and imageUrl');
    }
    if (typeof payload.audioUrl !== 'string') {
      throw new BadRequestException('Recognition item audioUrl must be a string');
    }
  }
}

@Injectable()
export class LessonEntriesService {
  constructor(
    @InjectRepository(LessonEntry)
    private readonly entries: Repository<LessonEntry>,
    @InjectRepository(Lesson)
    private readonly lessons: Repository<Lesson>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listByLesson(lessonId: string): Promise<LessonEntryRow[]> {
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const rows = await this.entries.find({
      where: { lessonId },
      order: { kind: 'ASC', orderIndex: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(toRow);
  }

  async replaceForLesson(
    lessonId: string,
    dto: ReplaceLessonEntriesDto,
  ): Promise<LessonEntryRow[]> {
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    dto.entries.forEach((entry) => validatePayload(entry.kind, entry.payload));

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(LessonEntry);
      await repo.delete({ lessonId });
      if (dto.entries.length === 0) return [];
      const rows = dto.entries.map((input) =>
        repo.create({
          lessonId,
          kind: input.kind,
          orderIndex: input.orderIndex,
          payload: input.payload,
        }),
      );
      const saved = await repo.save(rows);
      return saved
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(toRow);
    });
  }
}
