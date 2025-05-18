import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  IObjectiveRepository,
  OBJECTIVE_REPOSITORY,
} from '@domain/objectives/interfaces/objective.repository.interface';
import {
  IGoalRepository,
  GOAL_REPOSITORY,
} from '@domain/goals/interfaces/goal.repository.interface';
import {
  Objective,
  ObjectiveStatus,
} from '@domain/objectives/entities/objective.entity';
import { CreateObjectiveDto } from '@domain/objectives/dtos/create-objective.dto';
import { UpdateObjectiveDto } from '@domain/objectives/dtos/update-objective.dto';
import { ObjectiveDto } from '@domain/objectives/dtos/objective.dto';

@Injectable()
export class ObjectiveService {
  constructor(
    @Inject(OBJECTIVE_REPOSITORY)
    private readonly objectiveRepository: IObjectiveRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
  ) {}

  // Create a new objective
  async createObjective(
    createObjectiveDto: CreateObjectiveDto,
    userId: string,
  ): Promise<ObjectiveDto> {
    // Validate that all goals exist
    await this.validateGoalsExist(createObjectiveDto.goalIds);

    const objective = new Objective(
      createObjectiveDto.name,
      createObjectiveDto.description,
      createObjectiveDto.goalIds.map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(userId),
      createObjectiveDto.status || ObjectiveStatus.DRAFT,
      createObjectiveDto.organizationId
        ? new Types.ObjectId(createObjectiveDto.organizationId)
        : undefined,
    );

    const createdObjective = await this.objectiveRepository.create(objective);
    return ObjectiveDto.fromEntity(createdObjective);
  }

  // Get objective by ID
  async getObjectiveById(id: string): Promise<ObjectiveDto> {
    const objective = await this.objectiveRepository.findById(id);
    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }
    return ObjectiveDto.fromEntity(objective);
  }

  // Get objectives by user ID
  async getObjectivesByUserId(userId: string): Promise<ObjectiveDto[]> {
    const objectives = await this.objectiveRepository.findByCreatedBy(userId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  // Get objectives by goal ID
  async getObjectivesByGoalId(goalId: string): Promise<ObjectiveDto[]> {
    const objectives = await this.objectiveRepository.findByGoalId(goalId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  // Get objectives by organization ID
  async getObjectivesByOrganizationId(
    organizationId: string,
  ): Promise<ObjectiveDto[]> {
    const objectives =
      await this.objectiveRepository.findByOrganizationId(organizationId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  // Update an objective
  async updateObjective(
    id: string,
    updateObjectiveDto: UpdateObjectiveDto,
  ): Promise<ObjectiveDto> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    // Validate goals if provided
    if (updateObjectiveDto.goalIds) {
      await this.validateGoalsExist(updateObjectiveDto.goalIds);
    }

    const updateData: Partial<Objective> = {
      ...(updateObjectiveDto.name && { name: updateObjectiveDto.name }),
      ...(updateObjectiveDto.description && {
        description: updateObjectiveDto.description,
      }),
      ...(updateObjectiveDto.status && { status: updateObjectiveDto.status }),
      ...(updateObjectiveDto.goalIds && {
        goalIds: updateObjectiveDto.goalIds.map((id) => new Types.ObjectId(id)),
      }),
      ...(updateObjectiveDto.organizationId && {
        organizationId: new Types.ObjectId(updateObjectiveDto.organizationId),
      }),
      updatedAt: new Date(),
    };

    const updatedObjective = await this.objectiveRepository.update(
      id,
      updateData,
    );
    if (!updatedObjective) {
      throw new NotFoundException(
        `Objective with ID ${id} not found after update`,
      );
    }

    return ObjectiveDto.fromEntity(updatedObjective);
  }

  // Delete an objective
  async deleteObjective(id: string): Promise<boolean> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    return this.objectiveRepository.delete(id);
  }

  // Update objective status
  async updateObjectiveStatus(
    id: string,
    status: ObjectiveStatus,
  ): Promise<ObjectiveDto> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    const updateData: Partial<Objective> = {
      status,
      updatedAt: new Date(),
    };

    const updatedObjective = await this.objectiveRepository.update(
      id,
      updateData,
    );
    if (!updatedObjective) {
      throw new NotFoundException(
        `Objective with ID ${id} not found after update`,
      );
    }

    return ObjectiveDto.fromEntity(updatedObjective);
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
}
