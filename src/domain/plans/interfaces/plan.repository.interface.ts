import { Plan } from '@domain/plans/entities/plan.entity';

export const PLAN_REPOSITORY = 'PLAN_REPOSITORY';

export interface IPlanRepository {
  findById(id: string): Promise<Plan | null>;
  findByIds(ids: string[]): Promise<Plan[]>;
  findByCreatedBy(userId: string): Promise<Plan[]>;
  findByGoalId(goalId: string): Promise<Plan[]>;
  findByObjectiveId(objectiveId: string): Promise<Plan[]>;
  findByOrganizationId(organizationId: string): Promise<Plan[]>;
  create(plan: Plan): Promise<Plan>;
  update(id: string, plan: Partial<Plan>): Promise<Plan | null>;
  updateWithVersion(
    id: string,
    plan: Partial<Plan>,
    version: number,
  ): Promise<Plan | null>;
  delete(id: string): Promise<boolean>;
  findVersionsById(id: string): Promise<Plan[]>;
  createNewVersion(plan: Plan): Promise<Plan>;
}
