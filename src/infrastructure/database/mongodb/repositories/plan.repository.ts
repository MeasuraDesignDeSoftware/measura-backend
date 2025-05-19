import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanDocument } from '../schemas/plan.schema';
import { IPlanRepository } from '@domain/plans/interfaces/plan.repository.interface';
import { Plan } from '@domain/plans/entities/plan.entity';

@Injectable()
export class PlanRepository implements IPlanRepository {
  private readonly logger = new Logger(PlanRepository.name);

  constructor(
    @InjectModel('Plan')
    private readonly planModel: Model<PlanDocument>,
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

  private mapToEntity(doc: PlanDocument): Plan {
    const {
      _id,
      name,
      description,
      goalIds,
      objectiveIds,
      status,
      startDate,
      endDate,
      approvedBy,
      approvedDate,
      organizationId,
      createdBy,
      createdAt,
      updatedAt,
      version,
    } = doc;

    const typedId = this.toObjectId(_id) || new Types.ObjectId();
    const createdByAsObjectId =
      this.toObjectId(createdBy) || new Types.ObjectId();
    const orgIdAsObjectId = this.toObjectId(organizationId);
    const typedGoalIds = this.toObjectIdArray(goalIds);
    const typedObjectiveIds = this.toObjectIdArray(objectiveIds);

    const plan = new Plan(
      name,
      description,
      typedGoalIds,
      typedObjectiveIds,
      createdByAsObjectId,
      status,
      startDate,
      endDate,
      orgIdAsObjectId || undefined,
      typedId,
      version,
    );

    if (approvedBy) {
      plan.approvedBy = this.toObjectId(approvedBy) || undefined;
    }

    if (approvedDate) plan.approvedDate = approvedDate;

    plan.createdAt = createdAt;
    plan.updatedAt = updatedAt;

    return plan;
  }

  async findById(id: string): Promise<Plan | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.warn(`Invalid ObjectId format in findById: ${id}`);
        return null;
      }

      const planDoc = await this.planModel.findById(id).exec();
      return planDoc ? this.mapToEntity(planDoc) : null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findById: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<Plan[]> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const objectIdsArray = ids
        .map((id) => this.toObjectId(id))
        .filter((id): id is Types.ObjectId => id !== null);

      if (objectIdsArray.length === 0) {
        return [];
      }

      const planDocs = await this.planModel
        .find({ _id: { $in: objectIdsArray } })
        .exec();
      return planDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findByIds: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findByCreatedBy(userId: string): Promise<Plan[]> {
    try {
      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        this.logger.warn(
          `Invalid ObjectId format in findByCreatedBy: ${userId}`,
        );
        return [];
      }

      const planDocs = await this.planModel
        .find({ createdBy: userObjectId })
        .exec();
      return planDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findByCreatedBy: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findByGoalId(goalId: string): Promise<Plan[]> {
    try {
      const goalObjectId = this.toObjectId(goalId);
      if (!goalObjectId) {
        this.logger.warn(`Invalid ObjectId format in findByGoalId: ${goalId}`);
        return [];
      }

      const planDocs = await this.planModel
        .find({ goalIds: goalObjectId })
        .exec();
      return planDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in findByGoalId: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findByObjectiveId(objectiveId: string): Promise<Plan[]> {
    try {
      const objectiveObjectId = this.toObjectId(objectiveId);
      if (!objectiveObjectId) {
        this.logger.warn(
          `Invalid ObjectId format in findByObjectiveId: ${objectiveId}`,
        );
        return [];
      }

      const planDocs = await this.planModel
        .find({ objectiveIds: objectiveObjectId })
        .exec();
      return planDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findByObjectiveId: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async findByOrganizationId(organizationId: string): Promise<Plan[]> {
    try {
      const orgObjectId = this.toObjectId(organizationId);
      if (!orgObjectId) {
        this.logger.warn(
          `Invalid ObjectId format in findByOrganizationId: ${organizationId}`,
        );
        return [];
      }

      const planDocs = await this.planModel
        .find({ organizationId: orgObjectId })
        .exec();
      return planDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findByOrganizationId: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async create(plan: Plan): Promise<Plan> {
    try {
      const normalizedPlan = {
        _id: plan._id,
        name: plan.name || '',
        description: plan.description || '',
        goalIds: this.toObjectIdArray(plan.goalIds),
        objectiveIds: this.toObjectIdArray(plan.objectiveIds),
        status: plan.status,
        startDate: plan.startDate,
        endDate: plan.endDate,
        approvedBy: this.toObjectId(plan.approvedBy),
        approvedDate: plan.approvedDate,
        organizationId: this.toObjectId(plan.organizationId),
        createdBy: this.toObjectId(plan.createdBy),
        version: plan.version || 1,
        createdAt: plan.createdAt || new Date(),
        updatedAt: plan.updatedAt || new Date(),
      };

      const createdPlan = await this.planModel.create(normalizedPlan);
      return this.mapToEntity(createdPlan);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in create: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async update(id: string, plan: Partial<Plan>): Promise<Plan | null> {
    try {
      const objectId = this.toObjectId(id);
      if (!objectId) {
        this.logger.warn(`Invalid ObjectId format in update: ${id}`);
        return null;
      }

      const { version, ...planData } = plan;
      if (version === undefined) {
        this.logger.warn(
          `Update attempted without version number for plan ${id}`,
        );
        return null;
      }

      const $set: Record<string, any> = {
        updatedAt: new Date(),
        version: version + 1,
      };

      const $unset: Record<string, number> = {};
      let hasUnsetFields = false;

      if (planData.name !== undefined) $set.name = planData.name || '';
      if (planData.description !== undefined)
        $set.description = planData.description || '';
      if (planData.status !== undefined) $set.status = planData.status;
      if (planData.startDate !== undefined) $set.startDate = planData.startDate;
      if (planData.endDate !== undefined) $set.endDate = planData.endDate;
      if (planData.approvedDate !== undefined)
        $set.approvedDate = planData.approvedDate;

      if (planData.goalIds !== undefined) {
        $set.goalIds = this.toObjectIdArray(planData.goalIds);
      }
      if (planData.objectiveIds !== undefined) {
        $set.objectiveIds = this.toObjectIdArray(planData.objectiveIds);
      }

      if ('approvedBy' in planData) {
        if (planData.approvedBy === undefined) {
          $unset.approvedBy = 1;
          hasUnsetFields = true;
        } else {
          $set.approvedBy = this.toObjectId(planData.approvedBy);
        }
      }

      if ('organizationId' in planData) {
        if (planData.organizationId === undefined) {
          $unset.organizationId = 1;
          hasUnsetFields = true;
        } else {
          $set.organizationId = this.toObjectId(planData.organizationId);
        }
      }

      if ('approvedDate' in planData && planData.approvedDate === undefined) {
        $unset.approvedDate = 1;
        hasUnsetFields = true;
      }

      if ('createdBy' in planData) {
        $set.createdBy = this.toObjectId(planData.createdBy);
      }

      const updateDoc: Record<string, any> = { $set };
      if (hasUnsetFields) updateDoc.$unset = $unset;

      const updatedPlan = await this.planModel
        .findOneAndUpdate({ _id: objectId, version: version }, updateDoc, {
          new: true,
        })
        .exec();

      if (!updatedPlan) {
        const currentPlan = await this.planModel.findById(objectId).exec();
        if (currentPlan) {
          this.logger.warn(
            `Optimistic lock failure: attempted to update plan ${id} with version ${version}, but current version is ${currentPlan.version}`,
          );
        } else {
          this.logger.warn(`Plan ${id} not found during update`);
        }
        return null;
      }

      return this.mapToEntity(updatedPlan);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in update: ${errorMessage}`, errorStack);
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

      const result = await this.planModel.deleteOne({ _id: objectId }).exec();
      return result.deletedCount > 0;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error in delete: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async findVersionsById(id: string): Promise<Plan[]> {
    try {
      const objectId = this.toObjectId(id);
      if (!objectId) {
        this.logger.warn(`Invalid ObjectId format in findVersionsById: ${id}`);
        return [];
      }

      const planDoc = await this.planModel.findById(objectId).exec();
      if (!planDoc) return [];

      const versionDocs = await this.planModel
        .find({
          name: planDoc.name,
          createdBy: planDoc.createdBy,
        })
        .sort({ version: -1 })
        .exec();

      return versionDocs.map((doc) => this.mapToEntity(doc));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in findVersionsById: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async createNewVersion(plan: Plan): Promise<Plan> {
    try {
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          const createdBy = this.toObjectId(plan.createdBy);
          if (!createdBy) {
            throw new Error('Invalid createdBy value');
          }

          const highestVersion = await this.planModel
            .findOne(
              { name: plan.name, createdBy },
              { version: 1 },
              { sort: { version: -1 } },
            )
            .exec();

          const nextVersion = highestVersion
            ? (highestVersion.version || 0) + 1
            : 1;

          const newVersion = new Plan(
            plan.name,
            plan.description,
            this.toObjectIdArray(plan.goalIds),
            this.toObjectIdArray(plan.objectiveIds),
            createdBy,
            plan.status,
            plan.startDate,
            plan.endDate,
            this.toObjectId(plan.organizationId) || undefined,
            new Types.ObjectId(),
            nextVersion,
          );

          if (plan.approvedBy) {
            newVersion.approvedBy =
              this.toObjectId(plan.approvedBy) || undefined;
          }
          if (plan.approvedDate) newVersion.approvedDate = plan.approvedDate;

          return await this.create(newVersion);
        } catch (error) {
          if (
            error instanceof Error &&
            (error.name === 'MongoError' ||
              error.name === 'MongoServerError') &&
            'code' in error &&
            error.code === 11000
          ) {
            retryCount++;
            this.logger.warn(
              `Version collision detected, retrying (${retryCount}/${maxRetries})`,
            );

            await new Promise((resolve) =>
              setTimeout(resolve, 50 + Math.random() * 150),
            );
          } else {
            throw error;
          }
        }
      }

      throw new Error(
        `Failed to create new version after ${maxRetries} attempts due to concurrency conflicts`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in createNewVersion: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async updateWithVersion(
    id: string,
    plan: Partial<Plan>,
    version: number,
  ): Promise<Plan | null> {
    try {
      const objectId = this.toObjectId(id);
      if (!objectId) {
        this.logger.warn(`Invalid ObjectId format in updateWithVersion: ${id}`);
        return null;
      }

      if (version === undefined || version <= 0) {
        this.logger.warn(
          `Update attempted with invalid version number for plan ${id}: ${version}`,
        );
        return null;
      }

      const $set: Record<string, any> = {
        updatedAt: new Date(),
        version: version + 1,
      };

      const $unset: Record<string, number> = {};
      let hasUnsetFields = false;

      if (plan.name !== undefined) $set.name = plan.name || '';
      if (plan.description !== undefined)
        $set.description = plan.description || '';
      if (plan.status !== undefined) $set.status = plan.status;
      if (plan.startDate !== undefined) $set.startDate = plan.startDate;
      if (plan.endDate !== undefined) $set.endDate = plan.endDate;
      if (plan.approvedDate !== undefined)
        $set.approvedDate = plan.approvedDate;

      if (plan.goalIds !== undefined) {
        $set.goalIds = this.toObjectIdArray(plan.goalIds);
      }
      if (plan.objectiveIds !== undefined) {
        $set.objectiveIds = this.toObjectIdArray(plan.objectiveIds);
      }

      if ('approvedBy' in plan) {
        if (plan.approvedBy === undefined) {
          $unset.approvedBy = 1;
          hasUnsetFields = true;
        } else {
          $set.approvedBy = this.toObjectId(plan.approvedBy);
        }
      }

      if ('organizationId' in plan) {
        if (plan.organizationId === undefined) {
          $unset.organizationId = 1;
          hasUnsetFields = true;
        } else {
          $set.organizationId = this.toObjectId(plan.organizationId);
        }
      }

      if ('approvedDate' in plan && plan.approvedDate === undefined) {
        $unset.approvedDate = 1;
        hasUnsetFields = true;
      }

      if ('createdBy' in plan) {
        $set.createdBy = this.toObjectId(plan.createdBy);
      }

      const updateDoc: Record<string, any> = { $set };
      if (hasUnsetFields) updateDoc.$unset = $unset;

      const updatedPlan = await this.planModel
        .findOneAndUpdate({ _id: objectId, version: version }, updateDoc, {
          new: true,
        })
        .exec();

      if (!updatedPlan) {
        const currentPlan = await this.planModel.findById(objectId).exec();
        if (currentPlan) {
          this.logger.warn(
            `Optimistic lock failure: attempted to update plan ${id} with version ${version}, but current version is ${currentPlan.version}`,
          );
        } else {
          this.logger.warn(`Plan ${id} not found during update`);
        }
        return null;
      }

      return this.mapToEntity(updatedPlan);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error in updateWithVersion: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
