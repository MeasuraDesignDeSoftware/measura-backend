import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Metric, MetricDocument } from '@domain/metrics/entities/metric.entity';
import { IMetricRepository } from '@domain/metrics/interfaces/metric.repository.interface';

@Injectable()
export class MetricRepository implements IMetricRepository {
  constructor(
    @InjectModel(Metric.name)
    private readonly metricModel: Model<MetricDocument>,
  ) {}

  async create(metric: Partial<Metric>): Promise<Metric> {
    const createdMetric = new this.metricModel(metric);
    return createdMetric.save();
  }

  async findById(id: string): Promise<Metric | null> {
    return this.metricModel.findById(id).exec();
  }

  async findAll(): Promise<Metric[]> {
    return this.metricModel.find().exec();
  }

  async update(id: string, metric: Partial<Metric>): Promise<Metric | null> {
    return this.metricModel.findByIdAndUpdate(id, metric, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.metricModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findByQuestionId(questionId: string): Promise<Metric[]> {
    return this.metricModel
      .find({ questionId: new Types.ObjectId(questionId) })
      .exec();
  }

  async findByGoalId(goalId: string): Promise<Metric[]> {
    // For this method, we need to join with questions to find metrics for a goal
    const metrics = await this.metricModel
      .aggregate<Metric>([
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question',
          },
        },
        {
          $match: {
            'question.goalId': new Types.ObjectId(goalId),
          },
        },
        {
          $project: {
            question: 0,
          },
        },
      ])
      .exec();

    return metrics;
  }

  async findByCreatedBy(userId: string): Promise<Metric[]> {
    return this.metricModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
  }
}
