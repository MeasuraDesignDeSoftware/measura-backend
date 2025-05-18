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
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(OBJECTIVE_REPOSITORY)
    private readonly objectiveRepository: IObjectiveRepository,
  ) {}

  // Create a new plan
  async createPlan(
    createPlanDto: CreatePlanDto,
    userId: string,
  ): Promise<PlanDto> {
    // Validate goals and objectives exist
    await this.validateGoalsExist(createPlanDto.goalIds);
    await this.validateObjectivesExist(createPlanDto.objectiveIds);

    const plan = new Plan(
      createPlanDto.name,
      createPlanDto.description,
      createPlanDto.goalIds.map((id) => new Types.ObjectId(id)),
      createPlanDto.objectiveIds.map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(userId),
      createPlanDto.status || PlanStatus.DRAFT,
      createPlanDto.startDate,
      createPlanDto.endDate,
      createPlanDto.organizationId
        ? new Types.ObjectId(createPlanDto.organizationId)
        : undefined,
    );

    const createdPlan = await this.planRepository.create(plan);
    return PlanDto.fromEntity(createdPlan);
  }

  // Get plan by ID
  async getPlanById(id: string): Promise<PlanDto> {
    const plan = await this.planRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return PlanDto.fromEntity(plan);
  }

  // Get plans by user ID
  async getPlansByUserId(userId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByCreatedBy(userId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  // Get plans by goal ID
  async getPlansByGoalId(goalId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByGoalId(goalId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  // Get plans by objective ID
  async getPlansByObjectiveId(objectiveId: string): Promise<PlanDto[]> {
    const plans = await this.planRepository.findByObjectiveId(objectiveId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  // Get plans by organization ID
  async getPlansByOrganizationId(organizationId: string): Promise<PlanDto[]> {
    const plans =
      await this.planRepository.findByOrganizationId(organizationId);
    return plans.map((plan) => PlanDto.fromEntity(plan));
  }

  // Update a plan
  async updatePlan(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanDto> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Validate approval status transition
    if (
      updatePlanDto.status === PlanStatus.APPROVED &&
      existingPlan.status !== PlanStatus.APPROVED
    ) {
      if (!updatePlanDto.approvedBy) {
        throw new BadRequestException(
          'Approved plans must have an approvedBy user ID',
        );
      }

      if (!updatePlanDto.approvedDate) {
        updatePlanDto.approvedDate = new Date();
      }
    }

    // Validate goals and objectives if provided
    if (updatePlanDto.goalIds) {
      await this.validateGoalsExist(updatePlanDto.goalIds);
    }

    if (updatePlanDto.objectiveIds) {
      await this.validateObjectivesExist(updatePlanDto.objectiveIds);
    }

    // Create update object
    const updateData: Partial<Plan> = {
      ...(updatePlanDto.name && { name: updatePlanDto.name }),
      ...(updatePlanDto.description && {
        description: updatePlanDto.description,
      }),
      ...(updatePlanDto.status && { status: updatePlanDto.status }),
      ...(updatePlanDto.startDate && { startDate: updatePlanDto.startDate }),
      ...(updatePlanDto.endDate && { endDate: updatePlanDto.endDate }),
      ...(updatePlanDto.goalIds && {
        goalIds: updatePlanDto.goalIds.map((id) => new Types.ObjectId(id)),
      }),
      ...(updatePlanDto.objectiveIds && {
        objectiveIds: updatePlanDto.objectiveIds.map(
          (id) => new Types.ObjectId(id),
        ),
      }),
      ...(updatePlanDto.organizationId && {
        organizationId: new Types.ObjectId(updatePlanDto.organizationId),
      }),
      ...(updatePlanDto.approvedBy && {
        approvedBy: new Types.ObjectId(updatePlanDto.approvedBy),
      }),
      ...(updatePlanDto.approvedDate && {
        approvedDate: updatePlanDto.approvedDate,
      }),
      updatedAt: new Date(),
    };

    const updatedPlan = await this.planRepository.update(id, updateData);
    if (!updatedPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found after update`);
    }

    return PlanDto.fromEntity(updatedPlan);
  }

  // Delete a plan
  async deletePlan(id: string): Promise<boolean> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    // Prevent deletion of approved or active plans
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

  // Create a new version of a plan
  async createNewVersion(id: string): Promise<PlanDto> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const newVersion = await this.planRepository.createNewVersion(existingPlan);
    return PlanDto.fromEntity(newVersion);
  }

  // Get all versions of a plan
  async getPlanVersions(id: string): Promise<PlanDto[]> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const versions = await this.planRepository.findVersionsById(id);
    return versions.map((version) => PlanDto.fromEntity(version));
  }

  // Validate that all goals in the list exist
  private async validateGoalsExist(goalIds: string[]): Promise<void> {
    const goals = await this.goalRepository.findByIds(goalIds);

    if (goals.length !== goalIds.length) {
      const foundGoalIds = goals.map((goal) => goal._id.toString());
      const missingGoalIds = goalIds.filter((id) => !foundGoalIds.includes(id));

      throw new BadRequestException(
        `The following goals do not exist: ${missingGoalIds.join(', ')}`,
      );
    }
  }

  // Validate that all objectives in the list exist
  private async validateObjectivesExist(objectiveIds: string[]): Promise<void> {
    const objectives = await this.objectiveRepository.findByIds(objectiveIds);

    if (objectives.length !== objectiveIds.length) {
      const foundObjectiveIds = objectives.map((objective) =>
        objective._id.toString(),
      );
      const missingObjectiveIds = objectiveIds.filter(
        (id) => !foundObjectiveIds.includes(id),
      );

      throw new BadRequestException(
        `The following objectives do not exist: ${missingObjectiveIds.join(', ')}`,
      );
    }
  }
}
