import { Estimate, EstimateStatus } from '@domain/fpa/entities/estimate.entity';

export const ESTIMATE_REPOSITORY = 'ESTIMATE_REPOSITORY';

export interface IEstimateRepository {
  create(estimate: Partial<Estimate>): Promise<Estimate>;
  findById(id: string): Promise<Estimate | null>;
  findByIds(ids: string[]): Promise<Estimate[]>;
  findByProject(projectId: string): Promise<Estimate[]>;
  findByStatus(status: EstimateStatus): Promise<Estimate[]>;
  findByCreatedBy(userId: string): Promise<Estimate[]>;
  findByOrganization(organizationId: string): Promise<Estimate[]>;
  findAll(): Promise<Estimate[]>;
  update(id: string, estimate: Partial<Estimate>): Promise<Estimate | null>;
  delete(id: string): Promise<boolean>;
  findLatestVersion(projectId: string): Promise<Estimate | null>;
  createNewVersion(id: string): Promise<Estimate | null>;
}
