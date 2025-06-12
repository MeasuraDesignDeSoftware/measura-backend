import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ObjectiveDocument } from '@infrastructure/database/mongodb/schemas/objective.schema';
import { IObjectiveRepository } from '@domain/gqm/interfaces/objective.repository.interface';
import { Objective } from '@domain/gqm/entities/objective.entity';

@Injectable()
export class ObjectiveRepository implements IObjectiveRepository {
  private readonly logger = new Logger(ObjectiveRepository.name);

  constructor(
    @InjectModel('Objective')
    private readonly objectiveModel: Model<ObjectiveDocument>,
  ) {}

  private toObjectId(id: any): Types.ObjectId | null {
    if (!id) return null;

    if (id instanceof Types.ObjectId) return id;

    if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
      return new Types.ObjectId(id);
    }

    return null;
  }

  private toObjectIdArray(ids: any[]): Types.ObjectId[] {
    if (!Array.isArray(ids)) return [];

    return ids
      .map((id) => this.toObjectId(id))
      .filter((id): id is Types.ObjectId => id !== null);
  }

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

    const objective = new Objective(
      name,
      description,
      this.toObjectIdArray(goalIds),
      (() => {
        const id = this.toObjectId(createdBy);
        if (!id) {
          throw new Error(
            'Objective.createdBy is required and must be a valid ObjectId',
          );
        }
        return id;
      })(),
      status,
      this.toObjectId(organizationId) || undefined,
      _id as Types.ObjectId,
    );

    objective.createdAt = createdAt;
    objective.updatedAt = updatedAt;

    return objective;
  }

  async findById(id: string): Promise<Objective | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in findById: ${id}`);
        return null;
      }

      const objectiveDoc = await this.objectiveModel.findById(id).exec();
      return objectiveDoc ? this.mapToEntity(objectiveDoc) : null;
    } catch (error) {
      this.logger.error(
        `Error in findById: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<Objective[]> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const objectIdsArray = this.toObjectIdArray(ids);

      if (objectIdsArray.length === 0) {
        return [];
      }

      const objectiveDocs = await this.objectiveModel
        .find({ _id: { $in: objectIdsArray } })
        .exec();
      return objectiveDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      this.logger.error(
        `Error in findByIds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findByCreatedBy(userId: string): Promise<Objective[]> {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        this.logger.warn(
          `Invalid ObjectId format in findByCreatedBy: ${userId}`,
        );
        return [];
      }

      const objectiveDocs = await this.objectiveModel
        .find({ createdBy: userObjectId })
        .exec();
      return objectiveDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      this.logger.error(
        `Error in findByCreatedBy: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findByGoalId(goalId: string): Promise<Objective[]> {
    try {
      const goalObjectId = this.toObjectId(goalId);
      if (!goalObjectId) {
        this.logger.warn(`Invalid ObjectId format in findByGoalId: ${goalId}`);
        return [];
      }

      const objectiveDocs = await this.objectiveModel
        .find({ goalIds: goalObjectId })
        .exec();
      return objectiveDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      this.logger.error(
        `Error in findByGoalId: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Objective[]> {
    try {
      const orgObjectId = this.toObjectId(organizationId);
      if (!orgObjectId) {
        this.logger.warn(
          `Invalid ObjectId format in findByOrganizationId: ${organizationId}`,
        );
        return [];
      }

      const objectiveDocs = await this.objectiveModel
        .find({ organizationId: orgObjectId })
        .exec();
      return objectiveDocs.map((doc) => this.mapToEntity(doc));
    } catch (error) {
      this.logger.error(
        `Error in findByOrganizationId: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  async create(objective: Objective): Promise<Objective> {
    try {
      const normalizedObjective = {
        name: objective.name,
        description: objective.description,
        goalIds: this.toObjectIdArray(objective.goalIds),
        status: objective.status,
        organizationId: this.toObjectId(objective.organizationId),
        createdBy: this.toObjectId(objective.createdBy),
        createdAt: objective.createdAt || new Date(),
        updatedAt: objective.updatedAt || new Date(),
      };

      const createdObjective =
        await this.objectiveModel.create(normalizedObjective);
      return this.mapToEntity(createdObjective);
    } catch (error) {
      this.logger.error(
        `Error in create: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    objective: Partial<Objective>,
  ): Promise<Objective | null> {
    try {
      const objectId = this.toObjectId(id);
      if (!objectId) {
        this.logger.warn(`Invalid ObjectId format in update: ${id}`);
        return null;
      }

      const setFields: Record<string, any> = {
        updatedAt: new Date(),
      };
      const unsetFields: Record<string, number> = {};
      let hasUnsetFields = false;

      if (objective.name !== undefined) setFields.name = objective.name;
      if (objective.description !== undefined)
        setFields.description = objective.description;
      if (objective.status !== undefined) setFields.status = objective.status;

      if (objective.goalIds !== undefined) {
        setFields.goalIds = this.toObjectIdArray(objective.goalIds);
      }

      if ('organizationId' in objective) {
        if (
          objective.organizationId === undefined ||
          objective.organizationId === null
        ) {
          unsetFields.organizationId = 1;
          hasUnsetFields = true;
        } else {
          setFields.organizationId = this.toObjectId(objective.organizationId);
        }
      }

      const mongoUpdate: Record<string, any> = {};
      if (Object.keys(setFields).length > 0) mongoUpdate.$set = setFields;
      if (hasUnsetFields) mongoUpdate.$unset = unsetFields;

      const updatedObjective = await this.objectiveModel
        .findByIdAndUpdate(objectId, mongoUpdate, {
          new: true,
          runValidators: true,
        })
        .exec();

      return updatedObjective ? this.mapToEntity(updatedObjective) : null;
    } catch (error) {
      this.logger.error(
        `Error in update: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const objectId = this.toObjectId(id);
      if (!objectId) {
        this.logger.warn(`Invalid ObjectId format in delete: ${id}`);
        return false;
      }

      const result = await this.objectiveModel
        .deleteOne({ _id: objectId })
        .exec();
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error(
        `Error in delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
