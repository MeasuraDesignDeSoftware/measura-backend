import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Metric, MetricDocument } from '@domain/metrics/entities/metric.entity';
import { IMetricRepository } from '@domain/metrics/interfaces/metric.repository.interface';

@Injectable()
export class MetricRepository implements IMetricRepository {
  constructor(
    @InjectModel(Metric.name)
    private readonly metricModel: Model<MetricDocument>,
    private readonly logger: Logger,
  ) {}

  private toObjectId(id: any): Types.ObjectId | null {
    if (!id) return null;

    if (id instanceof Types.ObjectId) return id;

    if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
      try {
        return new Types.ObjectId(id);
      } catch {
        this.logger.warn(`Failed to convert to ObjectId: ${String(id)}`);
        return null;
      }
    }

    return null;
  }

  private toObjectIdArray(ids: any[]): Types.ObjectId[] {
    if (!Array.isArray(ids)) return [];

    const validIds: Types.ObjectId[] = [];
    const invalidIds: any[] = [];

    ids.forEach((id) => {
      const objectId = this.toObjectId(id);
      if (objectId !== null) {
        validIds.push(objectId);
      } else {
        invalidIds.push(id);
      }
    });

    if (invalidIds.length > 0) {
      this.logger.warn(
        `Detected ${invalidIds.length} invalid ObjectIds: ${JSON.stringify(invalidIds)}`,
      );
    }

    return validIds;
  }

  async create(metric: Partial<Metric>): Promise<Metric> {
    try {
      const createdMetric = new this.metricModel(metric);
      return await createdMetric.save();
    } catch (error) {
      this.logger.error(
        `Error in create: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Metric | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in findById: ${id}`);
        return null;
      }
      return await this.metricModel.findById(id).exec();
    } catch (error) {
      this.logger.error(
        `Error in findById: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Metric[]> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const objectIds = this.toObjectIdArray(ids);

      if (objectIds.length === 0) {
        return [];
      }

      return await this.metricModel.find({ _id: { $in: objectIds } }).exec();
    } catch (error) {
      this.logger.error(
        `Error in findByIds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findAll(): Promise<Metric[]> {
    try {
      return await this.metricModel.find().exec();
    } catch (error) {
      this.logger.error(
        `Error in findAll: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async update(id: string, metric: Partial<Metric>): Promise<Metric | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in update: ${id}`);
        return null;
      }
      return await this.metricModel
        .findByIdAndUpdate(id, metric, { new: true, runValidators: true })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error in update: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in delete: ${id}`);
        return false;
      }
      const result = await this.metricModel
        .deleteOne({ _id: new Types.ObjectId(id) })
        .exec();
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(
        `Error in delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  async findByQuestionId(questionId: string): Promise<Metric[]> {
    try {
      if (!Types.ObjectId.isValid(questionId)) {
        this.logger.warn(
          `Invalid ObjectId format in findByQuestionId: ${questionId}`,
        );
        return [];
      }
      return await this.metricModel
        .find({ questionId: new Types.ObjectId(questionId) })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error in findByQuestionId: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findByGoalId(goalId: string): Promise<Metric[]> {
    try {
      if (!Types.ObjectId.isValid(goalId)) {
        this.logger.warn(`Invalid ObjectId format in findByGoalId: ${goalId}`);
        return [];
      }

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
    } catch (error) {
      this.logger.error(
        `Error in findByGoalId: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findByCreatedBy(userId: string): Promise<Metric[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        this.logger.warn(
          `Invalid ObjectId format in findByCreatedBy: ${userId}`,
        );
        return [];
      }
      return await this.metricModel
        .find({ createdBy: new Types.ObjectId(userId) })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error in findByCreatedBy: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }
}
