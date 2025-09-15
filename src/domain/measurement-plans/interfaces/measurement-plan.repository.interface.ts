import {
  MeasurementPlan,
  Objective,
  Question,
  Metric,
  Measurement,
} from '../entities/measurement-plan.entity';

export const MEASUREMENT_PLAN_REPOSITORY = 'MEASUREMENT_PLAN_REPOSITORY';

export interface IMeasurementPlanRepository {
  // Basic CRUD operations
  create(plan: Partial<MeasurementPlan>): Promise<MeasurementPlan>;
  findById(id: string): Promise<MeasurementPlan | null>;
  findAll(organizationId?: string, status?: string): Promise<MeasurementPlan[]>;
  findByOrganizationId(organizationId: string): Promise<MeasurementPlan[]>;
  findByProjectId(projectId: string): Promise<MeasurementPlan[]>;
  findByCreatedBy(userId: string): Promise<MeasurementPlan[]>;
  update(
    id: string,
    plan: Partial<MeasurementPlan>,
  ): Promise<MeasurementPlan | null>;
  delete(id: string): Promise<boolean>;

  // Nested entity operations - Objectives
  addObjective(
    planId: string,
    objective: Partial<Objective>,
  ): Promise<MeasurementPlan | null>;
  updateObjective(
    planId: string,
    objectiveId: string,
    objective: Partial<Objective>,
  ): Promise<MeasurementPlan | null>;
  deleteObjective(
    planId: string,
    objectiveId: string,
  ): Promise<MeasurementPlan | null>;

  // Nested entity operations - Questions
  addQuestion(
    planId: string,
    objectiveId: string,
    question: Partial<Question>,
  ): Promise<MeasurementPlan | null>;
  updateQuestion(
    planId: string,
    objectiveId: string,
    questionId: string,
    question: Partial<Question>,
  ): Promise<MeasurementPlan | null>;
  deleteQuestion(
    planId: string,
    objectiveId: string,
    questionId: string,
  ): Promise<MeasurementPlan | null>;

  // Nested entity operations - Metrics
  addMetric(
    planId: string,
    objectiveId: string,
    questionId: string,
    metric: Partial<Metric>,
  ): Promise<MeasurementPlan | null>;
  updateMetric(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
    metric: Partial<Metric>,
  ): Promise<MeasurementPlan | null>;
  deleteMetric(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
  ): Promise<MeasurementPlan | null>;

  // Nested entity operations - Measurements
  addMeasurement(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
    measurement: Partial<Measurement>,
  ): Promise<MeasurementPlan | null>;
  updateMeasurement(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
    measurementId: string,
    measurement: Partial<Measurement>,
  ): Promise<MeasurementPlan | null>;
  deleteMeasurement(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
    measurementId: string,
  ): Promise<MeasurementPlan | null>;

  // Aggregation queries for statistics
  getPlanStatistics(planId: string): Promise<{
    objectivesCount: number;
    questionsCount: number;
    metricsCount: number;
    measurementsCount: number;
  } | null>;

  // Pagination and filtering
  findWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: {
      status?: string;
      projectId?: string;
      search?: string;
    },
  ): Promise<{
    data: MeasurementPlan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  // Business rule validations
  validateUniqueMetricMnemonic(
    planId: string,
    mnemonic: string,
    excludeMetricId?: string,
  ): Promise<boolean>;
  validateUniqueMeasurementAcronym(
    planId: string,
    objectiveId: string,
    questionId: string,
    metricId: string,
    acronym: string,
    excludeMeasurementId?: string,
  ): Promise<boolean>;
}
