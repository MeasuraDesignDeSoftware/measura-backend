import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ObjectiveDocument } from '../schemas/objective.schema';
import { IObjectiveRepository } from '@domain/objectives/interfaces/objective.repository.interface';
import { Objective } from '@domain/objectives/entities/objective.entity';

@Injectable()
export class ObjectiveRepository implements IObjectiveRepository {
  constructor(
    @InjectModel('Objective')
    private readonly objectiveModel: Model<ObjectiveDocument>,
  ) {}

  private mapToEntity(doc: ObjectiveDocument): Objective {
    const {
      _id,
      name,
      description,
      goalIds,
      status,
      organizationId,
      createdBy,
      createdAt,
      updatedAt,
    } = doc;

    // Convert created by to the correct type
    const createdByAsObjectId =
      typeof createdBy === 'string' ? new Types.ObjectId(createdBy) : createdBy;

    // Convert organizationId to the correct type
    const orgIdAsObjectId =
      typeof organizationId === 'string' && organizationId
        ? new Types.ObjectId(organizationId)
        : organizationId;

    // Convert _id to the correct type if needed
    const typedId =
      _id instanceof Types.ObjectId
        ? _id
        : typeof _id === 'string'
          ? new Types.ObjectId(_id)
          : _id;

    const objective = new Objective(
      name,
      description,
      goalIds as unknown as Types.ObjectId[],
      createdByAsObjectId as Types.ObjectId,
      status,
      orgIdAsObjectId as Types.ObjectId | undefined,
      typedId as Types.ObjectId,
    );

    // Set timestamps from the document
    objective.createdAt = createdAt;
    objective.updatedAt = updatedAt;

    return objective;
  }

  async findById(id: string): Promise<Objective | null> {
    const objectiveDoc = await this.objectiveModel.findById(id).exec();
    return objectiveDoc ? this.mapToEntity(objectiveDoc) : null;
  }

  async findByIds(ids: string[]): Promise<Objective[]> {
    const objectIdsArray = ids.map((id) => new Types.ObjectId(id));
    const objectiveDocs = await this.objectiveModel
      .find({ _id: { $in: objectIdsArray } })
      .exec();
    return objectiveDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByCreatedBy(userId: string): Promise<Objective[]> {
    const objectiveDocs = await this.objectiveModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
    return objectiveDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByGoalId(goalId: string): Promise<Objective[]> {
    const objectiveDocs = await this.objectiveModel
      .find({ goalIds: new Types.ObjectId(goalId) })
      .exec();
    return objectiveDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByOrganizationId(organizationId: string): Promise<Objective[]> {
    const objectiveDocs = await this.objectiveModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .exec();
    return objectiveDocs.map((doc) => this.mapToEntity(doc));
  }

  async create(objective: Objective): Promise<Objective> {
    const createdObjective = await this.objectiveModel.create({
      _id: objective._id,
      name: objective.name,
      description: objective.description,
      goalIds: objective.goalIds,
      status: objective.status,
      organizationId: objective.organizationId,
      createdBy: objective.createdBy,
      createdAt: objective.createdAt,
      updatedAt: objective.updatedAt,
    });

    return this.mapToEntity(createdObjective);
  }

  async update(
    id: string,
    objective: Partial<Objective>,
  ): Promise<Objective | null> {
    const updatedObjective = await this.objectiveModel
      .findByIdAndUpdate(id, objective, { new: true })
      .exec();

    return updatedObjective ? this.mapToEntity(updatedObjective) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.objectiveModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    return result.deletedCount > 0;
  }
}
