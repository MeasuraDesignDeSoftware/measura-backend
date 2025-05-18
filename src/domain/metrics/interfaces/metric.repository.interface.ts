import { Metric } from '../entities/metric.entity';

export const METRIC_REPOSITORY = 'METRIC_REPOSITORY';

export interface IMetricRepository {
  create(metric: Partial<Metric>): Promise<Metric>;
  findById(id: string): Promise<Metric | null>;
  findAll(): Promise<Metric[]>;
  update(id: string, metric: Partial<Metric>): Promise<Metric | null>;
  delete(id: string): Promise<boolean>;
  findByQuestionId(questionId: string): Promise<Metric[]>;
  findByGoalId(goalId: string): Promise<Metric[]>;
  findByCreatedBy(userId: string): Promise<Metric[]>;
}
