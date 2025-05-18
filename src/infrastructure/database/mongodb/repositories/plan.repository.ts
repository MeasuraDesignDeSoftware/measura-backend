import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanDocument } from '../schemas/plan.schema';
import { IPlanRepository } from '@domain/plans/interfaces/plan.repository.interface';
import { Plan } from '@domain/plans/entities/plan.entity';

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    @InjectModel('Plan')
    private readonly planModel: Model<PlanDocument>,
  ) {}

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

    const plan = new Plan(
      name,
      description,
      goalIds as unknown as Types.ObjectId[],
      objectiveIds as unknown as Types.ObjectId[],
      createdByAsObjectId as Types.ObjectId,
      status,
      startDate,
      endDate,
      orgIdAsObjectId as Types.ObjectId | undefined,
      typedId as Types.ObjectId,
      version,
    );

    // Convert approved by to the correct type and set if exists
    if (approvedBy) {
      const approvedByAsObjectId =
        typeof approvedBy === 'string'
          ? new Types.ObjectId(approvedBy)
          : approvedBy;
      plan.approvedBy = approvedByAsObjectId as Types.ObjectId;
    }

    if (approvedDate) plan.approvedDate = approvedDate;

    // Set timestamps from the document
    plan.createdAt = createdAt;
    plan.updatedAt = updatedAt;

    return plan;
  }

  async findById(id: string): Promise<Plan | null> {
    const planDoc = await this.planModel.findById(id).exec();
    return planDoc ? this.mapToEntity(planDoc) : null;
  }

  async findByIds(ids: string[]): Promise<Plan[]> {
    const objectIdsArray = ids.map((id) => new Types.ObjectId(id));
    const planDocs = await this.planModel
      .find({ _id: { $in: objectIdsArray } })
      .exec();
    return planDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByCreatedBy(userId: string): Promise<Plan[]> {
    const planDocs = await this.planModel
      .find({ createdBy: new Types.ObjectId(userId) })
      .exec();
    return planDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByGoalId(goalId: string): Promise<Plan[]> {
    const planDocs = await this.planModel
      .find({ goalIds: new Types.ObjectId(goalId) })
      .exec();
    return planDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByObjectiveId(objectiveId: string): Promise<Plan[]> {
    const planDocs = await this.planModel
      .find({ objectiveIds: new Types.ObjectId(objectiveId) })
      .exec();
    return planDocs.map((doc) => this.mapToEntity(doc));
  }

  async findByOrganizationId(organizationId: string): Promise<Plan[]> {
    const planDocs = await this.planModel
      .find({ organizationId: new Types.ObjectId(organizationId) })
      .exec();
    return planDocs.map((doc) => this.mapToEntity(doc));
  }

  async create(plan: Plan): Promise<Plan> {
    const createdPlan = await this.planModel.create({
      _id: plan._id,
      name: plan.name,
      description: plan.description,
      goalIds: plan.goalIds,
      objectiveIds: plan.objectiveIds,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      approvedBy: plan.approvedBy,
      approvedDate: plan.approvedDate,
      organizationId: plan.organizationId,
      createdBy: plan.createdBy,
      version: plan.version,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    });

    return this.mapToEntity(createdPlan);
  }

  async update(id: string, plan: Partial<Plan>): Promise<Plan | null> {
    const updatedPlan = await this.planModel
      .findByIdAndUpdate(id, plan, { new: true })
      .exec();

    return updatedPlan ? this.mapToEntity(updatedPlan) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.planModel
      .deleteOne({ _id: new Types.ObjectId(id) })
      .exec();
    return result.deletedCount > 0;
  }

  async findVersionsById(id: string): Promise<Plan[]> {
    // Extract the base ID without version information
    const planDoc = await this.planModel.findById(id).exec();
    if (!planDoc) return [];

    // Find all plans with the same name and created by the same user
    const versionDocs = await this.planModel
      .find({
        name: planDoc.name,
        createdBy: planDoc.createdBy,
      })
      .sort({ version: -1 })
      .exec();

    return versionDocs.map((doc) => this.mapToEntity(doc));
  }

  async createNewVersion(plan: Plan): Promise<Plan> {
    // Find the latest version
    const latestVersion = await this.planModel
      .findOne({
        name: plan.name,
        createdBy: plan.createdBy,
      })
      .sort({ version: -1 })
      .exec();

    // Create a new plan with incremented version
    const newVersion = new Plan(
      plan.name,
      plan.description,
      plan.goalIds,
      plan.objectiveIds,
      plan.createdBy,
      plan.status,
      plan.startDate,
      plan.endDate,
      plan.organizationId,
      new Types.ObjectId(), // New ID for the new version
      (latestVersion?.version || 0) + 1,
    );

    if (plan.approvedBy) newVersion.approvedBy = plan.approvedBy;
    if (plan.approvedDate) newVersion.approvedDate = plan.approvedDate;

    return this.create(newVersion);
  }
}
