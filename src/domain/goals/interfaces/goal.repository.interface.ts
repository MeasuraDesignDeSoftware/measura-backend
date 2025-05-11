import { Goal } from '../entities/goal.entity';

export const GOAL_REPOSITORY = 'GOAL_REPOSITORY';

export interface IGoalRepository {
  create(goal: Partial<Goal>): Promise<Goal>;
  findById(id: string): Promise<Goal | null>;
  findAll(): Promise<Goal[]>;
  update(id: string, goal: Partial<Goal>): Promise<Goal | null>;
  delete(id: string): Promise<boolean>;
  findByCreatedBy(userId: string): Promise<Goal[]>;
}
