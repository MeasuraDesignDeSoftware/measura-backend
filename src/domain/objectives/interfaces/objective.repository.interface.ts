import { Objective } from '../entities/objective.entity';

export const OBJECTIVE_REPOSITORY = 'OBJECTIVE_REPOSITORY';

export interface IObjectiveRepository {
  findById(id: string): Promise<Objective | null>;
  findByIds(ids: string[]): Promise<Objective[]>;
  findByCreatedBy(userId: string): Promise<Objective[]>;
  findByGoalId(goalId: string): Promise<Objective[]>;
  findByOrganizationId(organizationId: string): Promise<Objective[]>;
  create(objective: Objective): Promise<Objective>;
  update(id: string, objective: Partial<Objective>): Promise<Objective | null>;
  delete(id: string): Promise<boolean>;
}
