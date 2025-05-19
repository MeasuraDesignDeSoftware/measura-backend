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

  async createObjective(
    createObjectiveDto: CreateObjectiveDto,
    userId: string,
  ): Promise<ObjectiveDto> {
    const goalIds = createObjectiveDto.goalIds ?? [];
    await this.validateGoalsExist(goalIds);

    if (
      createObjectiveDto.organizationId &&
      !Types.ObjectId.isValid(createObjectiveDto.organizationId)
    ) {
      throw new BadRequestException(
        `Invalid organizationId format: ${createObjectiveDto.organizationId}`,
      );
    }

    const objective = new Objective(
      createObjectiveDto.name,
      createObjectiveDto.description,
      goalIds.map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(userId),
      createObjectiveDto.status || ObjectiveStatus.DRAFT,
      createObjectiveDto.organizationId
        ? new Types.ObjectId(createObjectiveDto.organizationId)
        : undefined,
    );

    const createdObjective = await this.objectiveRepository.create(objective);
    return ObjectiveDto.fromEntity(createdObjective);
  }

  async getObjectiveById(id: string): Promise<ObjectiveDto> {
    const objective = await this.objectiveRepository.findById(id);
    if (!objective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }
    return ObjectiveDto.fromEntity(objective);
  }

  async getObjectivesByUserId(userId: string): Promise<ObjectiveDto[]> {
    const objectives = await this.objectiveRepository.findByCreatedBy(userId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  async getObjectivesByGoalId(goalId: string): Promise<ObjectiveDto[]> {
    const objectives = await this.objectiveRepository.findByGoalId(goalId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  async getObjectivesByOrganizationId(
    organizationId: string,
  ): Promise<ObjectiveDto[]> {
    const objectives =
      await this.objectiveRepository.findByOrganizationId(organizationId);
    return objectives.map((objective) => ObjectiveDto.fromEntity(objective));
  }

  async updateObjective(
    id: string,
    updateObjectiveDto: UpdateObjectiveDto,
  ): Promise<ObjectiveDto> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    if (updateObjectiveDto.goalIds) {
      await this.validateGoalsExist(updateObjectiveDto.goalIds);
    }
    if (
      updateObjectiveDto.status &&
      updateObjectiveDto.status !== existingObjective.status
    ) {
      this.validateStatusTransition(
        existingObjective.status,
        updateObjectiveDto.status,
      );
    }

    if (
      updateObjectiveDto.organizationId &&
      !Types.ObjectId.isValid(updateObjectiveDto.organizationId)
    ) {
      throw new BadRequestException(
        `Invalid organizationId format: ${updateObjectiveDto.organizationId}`,
      );
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

  async deleteObjective(id: string): Promise<boolean> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    return this.objectiveRepository.delete(id);
  }

  async updateObjectiveStatus(
    id: string,
    status: ObjectiveStatus,
  ): Promise<ObjectiveDto> {
    const existingObjective = await this.objectiveRepository.findById(id);
    if (!existingObjective) {
      throw new NotFoundException(`Objective with ID ${id} not found`);
    }

    if (status !== existingObjective.status) {
      this.validateStatusTransition(existingObjective.status, status);
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

  private async validateGoalsExist(goalIds: string[]): Promise<void> {
    if (goalIds == null) {
      throw new BadRequestException('Goal IDs list cannot be undefined');
    }

    const validGoalIds = goalIds.filter((id) => {
      try {
        return Types.ObjectId.isValid(id);
      } catch {
        return false;
      }
    });

    if (validGoalIds.length !== goalIds.length) {
      const invalidIds = goalIds.filter((id) => !validGoalIds.includes(id));
      throw new BadRequestException(
        `Invalid goal ID format: ${invalidIds.join(', ')}`,
      );
    }

    if (validGoalIds.length === 0) {
      return;
    }

    const goals = await this.goalRepository.findByIds(validGoalIds);

    if (goals.length !== validGoalIds.length) {
      const foundGoalIds = goals.map((goal) => goal._id.toString());
      const missingGoalIds = validGoalIds.filter(
        (id) => !foundGoalIds.includes(id),
      );

      throw new BadRequestException(
        `The following goals do not exist: ${missingGoalIds.join(', ')}`,
      );
    }
  }

  private validateStatusTransition(
    currentStatus: ObjectiveStatus,
    newStatus: ObjectiveStatus,
  ): void {
    const allowedTransitions: Record<ObjectiveStatus, ObjectiveStatus[]> = {
      [ObjectiveStatus.DRAFT]: [
        ObjectiveStatus.ACTIVE,
        ObjectiveStatus.ARCHIVED,
      ],
      [ObjectiveStatus.ACTIVE]: [
        ObjectiveStatus.COMPLETED,
        ObjectiveStatus.ARCHIVED,
      ],
      [ObjectiveStatus.COMPLETED]: [ObjectiveStatus.ARCHIVED],
      [ObjectiveStatus.ARCHIVED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition: Cannot change status from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedTransitions[currentStatus].join(', ')}`,
      );
    }
  }
}
