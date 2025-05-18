import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
} from '@domain/questions/entities/question.entity';
import { IQuestionRepository } from '@domain/questions/interfaces/question.repository.interface';

@Injectable()
export class QuestionRepository implements IQuestionRepository {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async create(question: Partial<Question>): Promise<Question> {
    const createdQuestion = new this.questionModel(question);
    return createdQuestion.save();
  }

  async findById(id: string): Promise<Question | null> {
    return this.questionModel.findById(id).exec();
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async update(
    id: string,
    question: Partial<Question>,
  ): Promise<Question | null> {
    return this.questionModel
      .findByIdAndUpdate(id, question, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.questionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findByGoalId(goalId: string): Promise<Question[]> {
    return this.questionModel
      .find({ goalId: new Types.ObjectId(goalId) })
      .exec();
  }

  async findByCreatedBy(userId: string): Promise<Question[]> {
    return this.questionModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
  }
}
