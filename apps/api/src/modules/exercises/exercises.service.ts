import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { ExerciseSubType } from '@lexiroot/shared';
import { Exercise } from './entities/exercise.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { ReplaceExercisesDto } from './dto/replace-exercises.dto';

export interface ExerciseRow {
  id: string;
  lessonId: string;
  subType: ExerciseSubType;
  orderIndex: number;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

function toRow(exercise: Exercise): ExerciseRow {
  return {
    id: exercise.id,
    lessonId: exercise.lessonId,
    subType: exercise.subType,
    orderIndex: exercise.orderIndex,
    payload: exercise.payload,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

function validatePayload(subType: ExerciseSubType, payload: Record<string, unknown>): void {
  function isStr(v: unknown): v is string {
    return typeof v === 'string';
  }
  function isOptionArr(v: unknown, fields: string[]): boolean {
    if (!Array.isArray(v) || v.length === 0) return false;
    return v.every((item) => {
      if (typeof item !== 'object' || item === null) return false;
      const o = item as Record<string, unknown>;
      return fields.every((f) => f in o);
    });
  }
  if (subType === 'listen-select') {
    if (!isStr(payload.audioUrl) || !isStr(payload.instruction)) {
      throw new BadRequestException('Listen & select needs audioUrl and instruction');
    }
    if (!isOptionArr(payload.options, ['id', 'label', 'isCorrect'])) {
      throw new BadRequestException('Listen & select needs at least one option');
    }
  } else if (subType === 'correct-meaning') {
    if (!isStr(payload.prompt) || !isStr(payload.instruction)) {
      throw new BadRequestException('Correct Meaning needs prompt and instruction');
    }
    if (!isOptionArr(payload.options, ['id', 'label', 'isCorrect'])) {
      throw new BadRequestException('Correct Meaning needs at least one option');
    }
  } else if (subType === 'word-arrange') {
    if (!isStr(payload.sentence) || !isStr(payload.correctAnswer)) {
      throw new BadRequestException('Word Arrange needs sentence and correctAnswer');
    }
    if (!isOptionArr(payload.tiles, ['id', 'label', 'isCorrect'])) {
      throw new BadRequestException('Word Arrange needs tiles');
    }
  } else if (subType === 'recognition') {
    if (!isStr(payload.word) || !isStr(payload.instruction)) {
      throw new BadRequestException('Recognition needs word and instruction');
    }
    if (!isOptionArr(payload.options, ['id', 'imageUrl', 'isCorrect'])) {
      throw new BadRequestException('Recognition needs at least one image option');
    }
  }
}

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exercises: Repository<Exercise>,
    @InjectRepository(Lesson)
    private readonly lessons: Repository<Lesson>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listByLesson(lessonId: string): Promise<ExerciseRow[]> {
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    const rows = await this.exercises.find({
      where: { lessonId },
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    });
    return rows.map(toRow);
  }

  async replaceForLesson(
    lessonId: string,
    dto: ReplaceExercisesDto,
  ): Promise<ExerciseRow[]> {
    const lesson = await this.lessons.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    dto.exercises.forEach((exercise) => validatePayload(exercise.subType, exercise.payload));

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Exercise);
      await repo.delete({ lessonId });
      if (dto.exercises.length === 0) return [];
      const rows = dto.exercises.map((input) =>
        repo.create({
          lessonId,
          subType: input.subType,
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
