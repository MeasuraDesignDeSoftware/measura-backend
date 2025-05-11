import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Types } from 'mongoose';
import { Goal } from '@domain/goals/entities/goal.entity';
import {
  IGoalRepository,
  GOAL_REPOSITORY,
} from '@domain/goals/interfaces/goal.repository.interface';
import { CreateGoalDto } from '@interfaces/api/dtos/goals/create-goal.dto';
import { UpdateGoalDto } from '@interfaces/api/dtos/goals/update-goal.dto';

@Injectable()
export class GoalService {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
  ) {}

  async create(
    createGoalDto: CreateGoalDto,
    userId: Types.ObjectId,
  ): Promise<Goal> {
    const goal = await this.goalRepository.create({
      ...createGoalDto,
      createdBy: userId,
    });
    return goal;
  }

  async findAll(): Promise<Goal[]> {
    return this.goalRepository.findAll();
  }

  async findOne(id: string): Promise<Goal> {
    const goal = await this.goalRepository.findById(id);
    if (!goal) {
      throw new NotFoundException(`Goal with ID "${id}" not found`);
    }
    return goal;
  }

  async update(id: string, updateGoalDto: UpdateGoalDto): Promise<Goal> {
    const goal = await this.goalRepository.update(id, updateGoalDto);
    if (!goal) {
      throw new NotFoundException(`Goal with ID "${id}" not found`);
    }
    return goal;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.goalRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Goal with ID "${id}" not found`);
    }
  }

  async findByUser(userId: string): Promise<Goal[]> {
    return this.goalRepository.findByCreatedBy(userId);
  }
}
