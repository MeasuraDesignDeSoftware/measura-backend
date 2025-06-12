import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Question,
  QuestionDocument,
} from '@domain/gqm/entities/question.entity';
import { IQuestionRepository } from '@domain/gqm/interfaces/question.repository.interface';

@Injectable()
export class QuestionRepository implements IQuestionRepository {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  private toObjectId(id: string | Types.ObjectId): Types.ObjectId | null {
    if (!id) return null;

    if (id instanceof Types.ObjectId) return id;

    if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
      return new Types.ObjectId(id);
    }

    return null;
  }

  async create(question: Partial<Question>): Promise<Question> {
    const createdQuestion = new this.questionModel(question);
    return createdQuestion.save();
  }

  async findById(id: string): Promise<Question | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.questionModel.findById(id).exec();
  }

  async findAll(): Promise<Question[]> {
    return this.questionModel.find().exec();
  }

  async update(
    id: string,
    question: Partial<Question>,
  ): Promise<Question | null> {
    const objectId = this.toObjectId(id);
    if (!objectId) return null;

    return this.questionModel
      .findByIdAndUpdate(objectId, question, { new: true, runValidators: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const objectId = this.toObjectId(id);
    if (!objectId) return false;

    const result = await this.questionModel.deleteOne({ _id: objectId }).exec();
    return result.deletedCount > 0;
  }

  async findByGoalId(goalId: string): Promise<Question[]> {
    const objectId = this.toObjectId(goalId);
    if (!objectId) return [];

    return this.questionModel.find({ goalId: objectId }).lean().exec();
  }

  async findByCreatedBy(userId: string): Promise<Question[]> {
    const objectId = this.toObjectId(userId);
    if (!objectId) return [];

    return this.questionModel.find({ createdBy: objectId }).exec();
  }
}
