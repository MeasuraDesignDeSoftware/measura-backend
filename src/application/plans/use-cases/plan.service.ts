import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  IPlanRepository,
  PLAN_REPOSITORY,
} from '@domain/plans/interfaces/plan.repository.interface';
import {
  IGoalRepository,
  GOAL_REPOSITORY,
} from '@domain/goals/interfaces/goal.repository.interface';
import {
  IObjectiveRepository,
  OBJECTIVE_REPOSITORY,
} from '@domain/objectives/interfaces/objective.repository.interface';
import { Plan, PlanStatus } from '@domain/plans/entities/plan.entity';
import { CreatePlanDto } from '@domain/plans/dtos/create-plan.dto';
import { UpdatePlanDto } from '@domain/plans/dtos/update-plan.dto';
import { PlanDto } from '@domain/plans/dtos/plan.dto';

@Injectable()
export class PlanService {
  private static readonly ALLOWED_TRANSITIONS: Record<
    PlanStatus,
    PlanStatus[]
  > = {
    [PlanStatus.DRAFT]: [
      PlanStatus.REVIEW,
      PlanStatus.APPROVED,
      PlanStatus.ARCHIVED,
    ],
    [PlanStatus.REVIEW]: [
      PlanStatus.DRAFT,
      PlanStatus.APPROVED,
      PlanStatus.ARCHIVED,
    ],
    [PlanStatus.APPROVED]: [
      PlanStatus.ACTIVE,
      PlanStatus.ARCHIVED,
      PlanStatus.DRAFT,
    ],
    [PlanStatus.ACTIVE]: [
      PlanStatus.COMPLETED,
      PlanStatus.ARCHIVED,
      PlanStatus.DRAFT,
    ],
    [PlanStatus.COMPLETED]: [PlanStatus.ARCHIVED, PlanStatus.ACTIVE],
    [PlanStatus.ARCHIVED]: [PlanStatus.DRAFT],
  };

  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(OBJECTIVE_REPOSITORY)
    private readonly objectiveRepository: IObjectiveRepository,
  ) {}

  async createPlan(
    createPlanDto: CreatePlanDto,
    userId: string,
  ): Promise<PlanDto> {
    await this.validateGoalsExist(createPlanDto.goalIds);
    await this.validateObjectivesExist(createPlanDto.objectiveIds);

    const status =
      createPlanDto.status !== undefined
        ? createPlanDto.status
        : PlanStatus.DRAFT;

    if (
      (status === PlanStatus.APPROVED || status === PlanStatus.ACTIVE) &&
      !createPlanDto.approvedBy
    ) {
      throw new BadRequestException(
        `Plans with ${status} status must include an approvedBy field`,
      );
    }
    if (createPlanDto.approvedBy) {
      this.validateApprovedByFormat(createPlanDto.approvedBy);
    }

    const plan = new Plan(
      createPlanDto.name,
      createPlanDto.description,
      (createPlanDto.goalIds ?? []).map((id) => new Types.ObjectId(id)),
      (createPlanDto.objectiveIds ?? []).map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(userId),
      status,
      createPlanDto.startDate,
      createPlanDto.endDate,
      createPlanDto.organizationId
        ? new Types.ObjectId(createPlanDto.organizationId)
        : undefined,
    );

    if (
      plan.status === PlanStatus.APPROVED ||
      plan.status === PlanStatus.ACTIVE
    ) {
      plan.approvedBy = createPlanDto.approvedBy
        ? new Types.ObjectId(createPlanDto.approvedBy)
        : undefined;
      plan.approvedDate = createPlanDto.approvedDate || new Date();
    }

    const createdPlan = await this.planRepository.create(plan);
    return PlanDto.fromEntity(createdPlan);
  }

  async getPlanById(id: string): Promise<PlanDto> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return PlanDto.fromEntity(plan);
  }

  async getPlansByUserId(userId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByCreatedBy(userId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  async getPlansByGoalId(goalId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByGoalId(goalId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  async getPlansByObjectiveId(objectiveId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByObjectiveId(objectiveId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  async getPlansByOrganizationId(organizationId: string): Promise<PlanDto[]> {
    const plans =
      await this.planRepository.findByOrganizationId(organizationId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanDto> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    if (
      updatePlanDto.status !== undefined &&
      updatePlanDto.status !== existingPlan.status
    ) {
      const newStatus: PlanStatus = updatePlanDto.status;
      this.validateStatusTransition(existingPlan.status, newStatus);

      if (
        newStatus === PlanStatus.APPROVED ||
        newStatus === PlanStatus.ACTIVE
      ) {
        if (!updatePlanDto.approvedBy) {
          throw new BadRequestException(
            `Plans with ${newStatus} status must have an approvedBy user ID`,
          );
        }

        this.validateApprovedByFormat(updatePlanDto.approvedBy);

        if (!updatePlanDto.approvedDate) {
          updatePlanDto.approvedDate = new Date();
        }
      }
    } else if (updatePlanDto.approvedBy) {
      this.validateApprovedByFormat(updatePlanDto.approvedBy);
    }

    if (updatePlanDto.goalIds !== undefined) {
      await this.validateGoalsExist(updatePlanDto.goalIds);
    }

    if (updatePlanDto.objectiveIds !== undefined) {
      await this.validateObjectivesExist(updatePlanDto.objectiveIds);
    }

    const updateData: Partial<Plan> = {
      updatedAt: new Date(),
    };

    if (updatePlanDto.name !== undefined) {
      updateData.name = updatePlanDto.name;
    }

    if (updatePlanDto.description !== undefined) {
      updateData.description = updatePlanDto.description;
    }

    if (updatePlanDto.status !== undefined) {
      updateData.status = updatePlanDto.status;
    }

    if (updatePlanDto.startDate !== undefined) {
      updateData.startDate = updatePlanDto.startDate;
    }

    if (updatePlanDto.endDate !== undefined) {
      updateData.endDate = updatePlanDto.endDate;
    }

    if (updatePlanDto.goalIds !== undefined) {
      updateData.goalIds = updatePlanDto.goalIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updatePlanDto.objectiveIds !== undefined) {
      updateData.objectiveIds = updatePlanDto.objectiveIds.map(
        (id) => new Types.ObjectId(id),
      );
    }

    if (updatePlanDto.organizationId !== undefined) {
      updateData.organizationId = updatePlanDto.organizationId
        ? new Types.ObjectId(updatePlanDto.organizationId)
        : undefined;
    }

    if (updatePlanDto.approvedBy !== undefined) {
      updateData.approvedBy = updatePlanDto.approvedBy
        ? new Types.ObjectId(updatePlanDto.approvedBy)
        : undefined;
    }

    if (updatePlanDto.approvedDate !== undefined) {
      updateData.approvedDate = updatePlanDto.approvedDate;
    }

    const updatedPlan = await this.planRepository.updateWithVersion(
      id,
      updateData,
      updatePlanDto.version,
    );

    if (!updatedPlan) {
      throw new ConflictException(
        `Plan with ID ${id} has been modified or not found. Please refresh and try again.`,
      );
    }
    if (updatePlanDto.version === undefined) {
      throw new BadRequestException(
        'Missing version field – please supply the current document version for optimistic locking',
      );
    }
    return PlanDto.fromEntity(updatedPlan);
  }

  async deletePlan(id: string): Promise<boolean> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    if (
      existingPlan.status === PlanStatus.APPROVED ||
      existingPlan.status === PlanStatus.ACTIVE
    ) {
      throw new ConflictException(
        `Cannot delete plan with status ${existingPlan.status}. Change status to ARCHIVED first.`,
      );
    }

    return this.planRepository.delete(id);
  }

  async createNewVersion(id: string): Promise<PlanDto> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const newVersion = await this.planRepository.createNewVersion(existingPlan);
    return PlanDto.fromEntity(newVersion);
  }

  async getPlanVersions(id: string): Promise<PlanDto[]> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const versions = await this.planRepository.findVersionsById(id);
    return versions.map((version) => PlanDto.fromEntity(version));
  }

  private async validateGoalsExist(goalIds: string[]): Promise<void> {
    if (goalIds === undefined) {
      throw new BadRequestException('Goal IDs list cannot be undefined');
    }

    if (goalIds.length === 0) {
      return;
    }

    for (const goalId of goalIds) {
      if (!Types.ObjectId.isValid(goalId)) {
        throw new BadRequestException(`Invalid goal ID format: ${goalId}`);
      }
    }

    const uniqueGoalIds = [...new Set(goalIds)];
    const goals = await this.goalRepository.findByIds(uniqueGoalIds);
    if (goals.length !== uniqueGoalIds.length) {
      if (goals.length !== goalIds.length) {
        const foundGoalIds = goals.map((g) => g._id.toString());
        const missingGoalIds = goalIds.filter(
          (id) => !foundGoalIds.includes(id),
        );

        throw new BadRequestException(
          `The following goals were not found: ${missingGoalIds.join(', ')}`,
        );
      }
    }
  }

  private async validateObjectivesExist(objectiveIds: string[]): Promise<void> {
    if (objectiveIds === undefined) {
      throw new BadRequestException('Objective IDs list cannot be undefined');
    }

    if (objectiveIds.length === 0) {
      return;
    }

    for (const objectiveId of objectiveIds) {
      if (!Types.ObjectId.isValid(objectiveId)) {
        throw new BadRequestException(
          `Invalid objective ID format: ${objectiveId}`,
        );
      }
    }

    const objectives = await this.objectiveRepository.findByIds(objectiveIds);

    if (objectives.length !== objectiveIds.length) {
      const foundObjectiveIds = objectives.map((o) => o._id.toString());
      const missingObjectiveIds = objectiveIds.filter(
        (id) => !foundObjectiveIds.includes(id),
      );

      throw new BadRequestException(
        `The following objectives were not found: ${missingObjectiveIds.join(', ')}`,
      );
    }
  }

  private validateStatusTransition(
    currentStatus: PlanStatus,
    newStatus: PlanStatus,
  ): void {
    if (!PlanService.ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw new ConflictException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private validateApprovedByFormat(approvedBy: string): void {
    if (!Types.ObjectId.isValid(approvedBy)) {
      throw new BadRequestException(
        `Invalid approvedBy ID format: ${approvedBy}`,
      );
    }
  }
}
