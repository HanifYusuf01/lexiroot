import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { LessonEntry } from './entities/lesson-entry.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { LessonEntriesController } from './lesson-entries.controller';
import { LessonEntriesService } from './lesson-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([LessonEntry, Lesson]), PaymentsModule],
  controllers: [LessonEntriesController],
  providers: [LessonEntriesService],
  exports: [LessonEntriesService],
})
export class LessonEntriesModule {}
