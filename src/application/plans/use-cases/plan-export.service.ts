import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import {
  IQuestionRepository,
  QUESTION_REPOSITORY,
} from '@domain/questions/interfaces/question.repository.interface';
import {
  IMetricRepository,
  METRIC_REPOSITORY,
} from '@domain/metrics/interfaces/metric.repository.interface';
import { PlanDto } from '@domain/plans/dtos/plan.dto';
import { GoalDto } from '@domain/goals/dtos/goal.dto';
import { ObjectiveDto } from '@domain/objectives/dtos/objective.dto';
import { QuestionDto } from '@domain/questions/dtos/question.dto';
import { MetricDto } from '@domain/metrics/dtos/metric.dto';
import { Plan, PlanStatus } from '@domain/plans/entities/plan.entity';
import { Types } from 'mongoose';
import { Goal } from '@domain/goals/entities/goal.entity';
import { Objective } from '@domain/objectives/entities/objective.entity';
import { Question } from '@domain/questions/entities/question.entity';
import { Metric } from '@domain/metrics/entities/metric.entity';

// Structure for complete measurement plan data with all related entities
export interface CompletePlanData {
  plan: PlanDto;
  goals: GoalDto[];
  objectives: ObjectiveDto[];
  questions: QuestionDto[];
  metrics: MetricDto[];
}

@Injectable()
export class PlanExportService {
  constructor(
    @Inject(PLAN_REPOSITORY)
    private readonly planRepository: IPlanRepository,
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(OBJECTIVE_REPOSITORY)
    private readonly objectiveRepository: IObjectiveRepository,
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: IQuestionRepository,
    @Inject(METRIC_REPOSITORY)
    private readonly metricRepository: IMetricRepository,
  ) {}

  // Get complete data for a plan (plan + all related entities)
  async getCompletePlanData(planId: string): Promise<CompletePlanData> {
    // Get the plan
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Convert plan to DTO
    const planDto = PlanDto.fromEntity(plan);

    // Get all related goals
    const goalIds = plan.goalIds.map((id) => id.toString());
    const goals = await this.goalRepository.findByIds(goalIds);

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      throw new BadRequestException('Failed to retrieve goals for the plan');
    }

    const goalDtos = goals.map((goal: Goal) => GoalDto.fromEntity(goal));

    // Get all related objectives
    const objectiveIds = plan.objectiveIds.map((id) => id.toString());
    const objectives = await this.objectiveRepository.findByIds(objectiveIds);

    if (!objectives || !Array.isArray(objectives)) {
      throw new BadRequestException(
        'Failed to retrieve objectives for the plan',
      );
    }

    const objectiveDtos = objectives.map((objective: Objective) =>
      ObjectiveDto.fromEntity(objective),
    );

    // Get all questions related to the goals
    const cleanGoalIds = goals.map((goal: Goal) => goal._id.toString());
    const questionsPromises = cleanGoalIds.map((goalId: string) =>
      this.questionRepository.findByGoalId(goalId),
    );

    const questionsResult = await Promise.all(questionsPromises);
    const allQuestions = questionsResult.flat();

    const questionDtos = allQuestions.map((question: Question) =>
      QuestionDto.fromEntity(question),
    );

    // Get all metrics related to the questions
    const questionIds = allQuestions.map((question: Question) =>
      question._id.toString(),
    );
    const metricsPromises = questionIds.map((questionId: string) =>
      this.metricRepository.findByQuestionId(questionId),
    );

    const metricsResult = await Promise.all(metricsPromises);
    const allMetrics = metricsResult.flat();

    const metricDtos = allMetrics.map((metric: Metric) =>
      MetricDto.fromEntity(metric),
    );

    return {
      plan: planDto,
      goals: goalDtos,
      objectives: objectiveDtos,
      questions: questionDtos,
      metrics: metricDtos,
    };
  }

  // Export plan as JSON
  async exportAsJson(planId: string): Promise<string> {
    const data = await this.getCompletePlanData(planId);
    return JSON.stringify(data, null, 2);
  }

  // Export plan as CSV
  async exportAsCsv(planId: string): Promise<string> {
    const data = await this.getCompletePlanData(planId);

    // Create CSV header
    const header = 'Type,ID,Name,Description,Status,Related To\n';

    // Create rows for plan
    let csvContent = header;
    csvContent += `Plan,${data.plan.id},${this.escapeCsvField(data.plan.name)},${this.escapeCsvField(data.plan.description)},${data.plan.status},""\n`;

    // Create rows for goals
    for (const goal of data.goals) {
      csvContent += `Goal,${goal.id},${this.escapeCsvField(goal.name)},${this.escapeCsvField(goal.description)},${goal.status},"${data.plan.id}"\n`;
    }

    // Create rows for objectives
    for (const objective of data.objectives) {
      csvContent += `Objective,${objective.id},${this.escapeCsvField(objective.name)},${this.escapeCsvField(objective.description)},${objective.status},"${data.plan.id}"\n`;
    }

    // Create rows for questions
    for (const question of data.questions) {
      const relatedGoal = data.goals.find(
        (goal) => goal.id === question.goalId,
      );
      csvContent += `Question,${question.id},${this.escapeCsvField(question.text)},${this.escapeCsvField(question.description || '')},${question.priority},"${relatedGoal?.id || ''}"\n`;
    }

    // Create rows for metrics
    for (const metric of data.metrics) {
      const relatedQuestion = data.questions.find(
        (q) => q.id === metric.questionId,
      );
      csvContent += `Metric,${metric.id},${this.escapeCsvField(metric.name)},${this.escapeCsvField(metric.description || '')},${metric.type},"${relatedQuestion?.id || ''}"\n`;
    }

    return csvContent;
  }

  // Helper to escape CSV fields
  private escapeCsvField(field: string): string {
    if (!field) return '';

    // If the field contains quotes, commas, or newlines, escape it
    if (field.includes('"') || field.includes(',') || field.includes('\n')) {
      // Double up any quotes and wrap the whole thing in quotes
      return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
  }

  // Import plan from JSON
  async importFromJson(jsonData: string, userId: string): Promise<PlanDto> {
    try {
      const data = JSON.parse(jsonData) as CompletePlanData;

      // For now, just create a new plan based on the imported data
      // In a real implementation, you would also create/update goals, objectives, etc.

      if (!data.plan) {
        throw new BadRequestException(
          'Invalid JSON data: missing plan information',
        );
      }

      // Create a simplified plan import that just contains the plan data
      const importedPlan = await this.createPlanFromImport(data.plan, userId);

      return importedPlan;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format');
      }
      throw error;
    }
  }

  // Helper to create a plan from imported data
  private async createPlanFromImport(
    planData: PlanDto,
    userId: string,
  ): Promise<PlanDto> {
    // In a real implementation, you would create goals, objectives, etc. first,
    // then use their IDs when creating the plan

    // For simplicity, we'll just create a new plan with the name and description
    const newPlan = new Plan(
      `${planData.name} (Imported)`,
      planData.description,
      (planData.goalIds || []).map((id) => new Types.ObjectId(id)),
      (planData.objectiveIds || []).map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(userId),
      planData.status || PlanStatus.DRAFT,
      planData.startDate,
      planData.endDate,
      planData.organizationId
        ? new Types.ObjectId(planData.organizationId)
        : undefined,
    );

    // Create the plan in the repository
    const createdPlan = await this.planRepository.create(newPlan);
    return PlanDto.fromEntity(createdPlan);
  }
}
