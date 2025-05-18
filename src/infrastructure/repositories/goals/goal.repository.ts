import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal, GoalDocument } from '../../../domain/goals/entities/goal.entity';
import { IGoalRepository } from '../../../domain/goals/interfaces/goal.repository.interface';

@Injectable()
export class GoalRepository implements IGoalRepository {
  constructor(
    @InjectModel(Goal.name) private readonly goalModel: Model<GoalDocument>,
  ) {}

  async create(goal: Partial<Goal>): Promise<Goal> {
    const createdGoal = new this.goalModel(goal);
    return createdGoal.save();
  }

  async findById(id: string): Promise<Goal | null> {
    return this.goalModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<Goal[]> {
    // Convert string IDs to ObjectIds for MongoDB query
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.goalModel.find({ _id: { $in: objectIds } }).exec();
  }

  async findAll(): Promise<Goal[]> {
    return this.goalModel.find().exec();
  }

  async update(id: string, goal: Partial<Goal>): Promise<Goal | null> {
    return this.goalModel.findByIdAndUpdate(id, goal, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.goalModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findByCreatedBy(userId: string): Promise<Goal[]> {
    return this.goalModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
  }
}
