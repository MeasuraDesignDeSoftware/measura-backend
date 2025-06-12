import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from '@domain/gqm/entities/goal.entity';
import { IGoalRepository } from '@domain/gqm/interfaces/goal.repository.interface';

@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
    private readonly logger: Logger,
  ) {}

  async create(goal: Partial<Goal>): Promise<Goal> {
    const createdGoal = new this.goalModel(goal);
    return createdGoal.save();
  }

  async findById(id: string): Promise<Goal | null> {
    return this.goalModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<Goal[]> {
    const objectIds = ids
      .map((id) => {
        try {
          return new Types.ObjectId(id);
        } catch {
          this.logger.warn(`Invalid ObjectId format: ${id}`);
          return null;
        }
      })
      .filter((id): id is Types.ObjectId => id !== null);

    if (objectIds.length === 0) {
      return [];
    }

    return this.goalModel.find({ _id: { $in: objectIds } }).exec();
  }

  async findAll(): Promise<Goal[]> {
    return this.goalModel.find().exec();
  }

  async update(id: string, goal: Partial<Goal>): Promise<Goal | null> {
    return this.goalModel.findByIdAndUpdate(id, goal, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.goalModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    return result.deletedCount > 0;
  }

  async findByCreatedBy(userId: string): Promise<Goal[]> {
    return this.goalModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
  }
}
