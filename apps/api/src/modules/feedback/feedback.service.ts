import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedback: Repository<Feedback>,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto): Promise<Feedback> {
    const row = this.feedback.create({
      userId,
      rating: dto.rating,
      message: dto.message ?? null,
    });
    return this.feedback.save(row);
  }
}
