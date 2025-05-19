import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
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
import * as mongoose from 'mongoose';
import * as puppeteer from 'puppeteer';

export interface CompletePlanData {
  plan: PlanDto;
  goals: GoalDto[];
  objectives: ObjectiveDto[];
  questions: QuestionDto[];
  metrics: MetricDto[];
}

@Injectable()
export class PlanExportService {
  private readonly logger = new Logger(PlanExportService.name);

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

  private toObjectId(
    id: string | Types.ObjectId | null | undefined,
  ): Types.ObjectId | null {
    if (!id) return null;

    try {
      if (id instanceof Types.ObjectId) return id;
      if (typeof id === 'string' && Types.ObjectId.isValid(id)) {
        return new Types.ObjectId(id);
      }
      return null;
    } catch {
      this.logger.warn(`Failed to convert to ObjectId: ${String(id)}`);
      return null;
    }
  }

  private toObjectIdArray(
    ids: (string | Types.ObjectId | null | undefined)[] | null | undefined,
  ): Types.ObjectId[] {
    if (!ids || !Array.isArray(ids)) return [];

    return ids
      .map((id) => this.toObjectId(id))
      .filter((id): id is Types.ObjectId => id !== null);
  }

  async getCompletePlanData(planId: string): Promise<CompletePlanData> {
    const planObjectId = this.toObjectId(planId);
    if (!planObjectId) {
      throw new BadRequestException(`Invalid plan ID format: ${planId}`);
    }

    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    const planDto = PlanDto.fromEntity(plan);

    const goalIds =
      plan.goalIds?.map((id) => id?.toString()).filter(Boolean) || [];

    const goals =
      goalIds.length > 0 ? await this.goalRepository.findByIds(goalIds) : [];

    const safeGoals = Array.isArray(goals) ? goals : [];
    const goalDtos = safeGoals.map((goal: Goal) => GoalDto.fromEntity(goal));

    const objectiveIds =
      plan.objectiveIds?.map((id) => id?.toString()).filter(Boolean) || [];

    const objectives =
      objectiveIds.length > 0
        ? await this.objectiveRepository.findByIds(objectiveIds)
        : [];

    const safeObjectives = Array.isArray(objectives) ? objectives : [];
    const objectiveDtos = safeObjectives.map((objective: Objective) =>
      ObjectiveDto.fromEntity(objective),
    );

    const cleanGoalIds = safeGoals
      .map((goal: Goal) => goal._id?.toString())
      .filter(Boolean);

    let allQuestions: Question[] = [];
    if (cleanGoalIds.length > 0) {
      try {
        const questionsPromises = cleanGoalIds.map((goalId: string) =>
          this.questionRepository.findByGoalId(goalId),
        );

        const questionsResult = await Promise.allSettled(questionsPromises);
        allQuestions = questionsResult
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              const reason =
                result.reason instanceof Error
                  ? result.reason.message
                  : 'Unknown error';
              this.logger.warn(
                `Failed to fetch questions for goal ${cleanGoalIds[index]}: ${reason}`,
              );
              return [];
            }
          })
          .flat();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error retrieving questions: ${errorMessage}`);
      }
    }

    const safeQuestions = Array.isArray(allQuestions) ? allQuestions : [];
    const questionDtos = safeQuestions.map((question: Question) =>
      QuestionDto.fromEntity(question),
    );

    const questionIds = safeQuestions
      .map((question: Question) => question._id?.toString())
      .filter(Boolean);

    let allMetrics: Metric[] = [];
    if (questionIds.length > 0) {
      try {
        const metricsPromises = questionIds.map((questionId: string) =>
          this.metricRepository.findByQuestionId(questionId),
        );

        const metricsResult = await Promise.allSettled(metricsPromises);
        allMetrics = metricsResult
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              const reason =
                result.reason instanceof Error
                  ? result.reason.message
                  : 'Unknown error';
              this.logger.warn(
                `Failed to fetch metrics for question ${questionIds[index]}: ${reason}`,
              );
              return [];
            }
          })
          .flat();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Error retrieving metrics: ${errorMessage}`);
      }
    }

    const safeMetrics = Array.isArray(allMetrics) ? allMetrics : [];
    const metricDtos = safeMetrics.map((metric: Metric) =>
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

  async exportAsJson(planId: string): Promise<string> {
    const data = await this.getCompletePlanData(planId);
    return JSON.stringify(data, null, 2);
  }

  async exportAsCsv(planId: string): Promise<string> {
    const data = await this.getCompletePlanData(planId);

    const header = 'Type,ID,Name,Description,Status,Related To\n';

    let csvContent = header;
    csvContent += `Plan,${data.plan.id},${this.escapeCsvField(data.plan.name)},${this.escapeCsvField(data.plan.description)},${this.escapeCsvField(String(data.plan.status))},""\n`;

    for (const goal of data.goals) {
      csvContent += `Goal,${goal.id},${this.escapeCsvField(goal.name)},${this.escapeCsvField(goal.description)},${this.escapeCsvField(String(goal.status))},"${data.plan.id}"\n`;
    }

    for (const objective of data.objectives) {
      csvContent += `Objective,${objective.id},${this.escapeCsvField(objective.name)},${this.escapeCsvField(objective.description)},${this.escapeCsvField(String(objective.status))},"${data.plan.id}"\n`;
    }

    for (const question of data.questions) {
      const relatedGoal = data.goals.find(
        (goal) => goal.id === question.goalId,
      );
      csvContent += `Question,${question.id},${this.escapeCsvField(question.text)},${this.escapeCsvField(String(question.description || ''))},${this.escapeCsvField(String(question.priority))},"${relatedGoal?.id || ''}"\n`;
    }

    for (const metric of data.metrics) {
      const relatedQuestion = data.questions.find(
        (q) => q.id === metric.questionId,
      );
      csvContent += `Metric,${metric.id},${this.escapeCsvField(metric.name)},${this.escapeCsvField(String(metric.description || ''))},${this.escapeCsvField(String(metric.type))},"${relatedQuestion?.id || ''}"\n`;
    }

    return csvContent;
  }

  private escapeCsvField(field: string): string {
    if (field === undefined || field === null) return '';

    const strField = String(field);

    const shouldEscapeFormulaInjection = /^[=+\-@\t ]/.test(strField);
    const safeField = shouldEscapeFormulaInjection ? `'${strField}` : strField;

    if (
      safeField.includes('"') ||
      safeField.includes(',') ||
      safeField.includes('\n')
    ) {
      return `"${safeField.replace(/"/g, '""')}"`;
    }

    return safeField;
  }

  async importFromJson(jsonData: string, userId: string): Promise<PlanDto> {
    try {
      if (!jsonData) {
        throw new BadRequestException('JSON data is required');
      }

      let data: CompletePlanData;
      try {
        data = JSON.parse(jsonData) as CompletePlanData;
      } catch {
        throw new BadRequestException('Invalid JSON format');
      }

      if (!data.plan) {
        throw new BadRequestException(
          'Invalid JSON data: missing plan information',
        );
      }

      const hasGoals = Array.isArray(data.goals) && data.goals.length > 0;
      const hasObjectives =
        Array.isArray(data.objectives) && data.objectives.length > 0;
      const hasQuestions =
        Array.isArray(data.questions) && data.questions.length > 0;
      const hasMetrics = Array.isArray(data.metrics) && data.metrics.length > 0;

      if (hasGoals || hasObjectives || hasQuestions || hasMetrics) {
        const ignoredArrays: string[] = [];
        if (hasGoals) ignoredArrays.push('goals');
        if (hasObjectives) ignoredArrays.push('objectives');
        if (hasQuestions) ignoredArrays.push('questions');
        if (hasMetrics) ignoredArrays.push('metrics');

        throw new BadRequestException(
          `Import contains data that will be ignored: ${ignoredArrays.join(', ')}. ` +
            'Only the plan object itself will be imported. Please import related entities separately.',
        );
      }

      const userObjectId = this.toObjectId(userId);
      if (!userObjectId) {
        throw new BadRequestException(`Invalid user ID format: ${userId}`);
      }

      await this.validateImportedPlanData(data);

      const importedPlan = await this.createPlanFromImport(
        data.plan,
        userObjectId,
      );

      return importedPlan;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException('Invalid JSON format');
      } else if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof NotFoundException) {
        throw error;
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Error importing plan from JSON: ${errorMessage}`,
          errorStack,
        );
        throw new InternalServerErrorException(
          `Failed to import plan: ${errorMessage}`,
        );
      }
    }
  }

  private async validateImportedPlanData(
    data: CompletePlanData,
  ): Promise<void> {
    if (!data.plan.name || typeof data.plan.name !== 'string') {
      throw new BadRequestException(
        'Plan name is required and must be a string',
      );
    }

    if (!data.plan.description || typeof data.plan.description !== 'string') {
      throw new BadRequestException(
        'Plan description is required and must be a string',
      );
    }

    if (
      data.plan.status &&
      !Object.values(PlanStatus).includes(data.plan.status)
    ) {
      throw new BadRequestException(
        `Invalid plan status. Must be one of: ${Object.values(PlanStatus).join(', ')}`,
      );
    }

    if (data.plan.startDate && !(data.plan.startDate instanceof Date)) {
      try {
        data.plan.startDate = new Date(data.plan.startDate);
        if (isNaN(data.plan.startDate.getTime())) {
          throw new BadRequestException('Invalid date');
        }
      } catch {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (data.plan.endDate && !(data.plan.endDate instanceof Date)) {
      try {
        data.plan.endDate = new Date(data.plan.endDate);
        if (isNaN(data.plan.endDate.getTime())) {
          throw new BadRequestException('Invalid date');
        }
      } catch {
        throw new BadRequestException('Invalid end date format');
      }
    }

    if (data.plan.approvedDate && !(data.plan.approvedDate instanceof Date)) {
      try {
        data.plan.approvedDate = new Date(data.plan.approvedDate);
        if (isNaN(data.plan.approvedDate.getTime())) {
          throw new BadRequestException('Invalid date');
        }
      } catch {
        throw new BadRequestException('Invalid approved date format');
      }
    }

    if (!Array.isArray(data.plan.goalIds)) {
      throw new BadRequestException('Plan goalIds must be an array');
    }

    if (!Array.isArray(data.plan.objectiveIds)) {
      throw new BadRequestException('Plan objectiveIds must be an array');
    }

    const validGoalIds = this.toObjectIdArray(data.plan.goalIds).map((id) =>
      id.toString(),
    );

    const validObjectiveIds = this.toObjectIdArray(data.plan.objectiveIds).map(
      (id) => id.toString(),
    );

    if (validGoalIds.length > 0) {
      const goals = await this.goalRepository.findByIds(validGoalIds);
      if (goals.length !== validGoalIds.length) {
        const foundGoalIds = goals.map((goal) => goal._id.toString());
        const missingGoalIds = validGoalIds.filter(
          (id) => !foundGoalIds.includes(id),
        );
        this.logger.warn(
          `The following goals do not exist: ${missingGoalIds.join(', ')}`,
        );

        data.plan.goalIds = foundGoalIds;
      }
    } else {
      data.plan.goalIds = [];
    }

    if (validObjectiveIds.length > 0) {
      const objectives =
        await this.objectiveRepository.findByIds(validObjectiveIds);
      if (objectives.length !== validObjectiveIds.length) {
        const foundObjectiveIds = objectives.map((objective) =>
          objective._id.toString(),
        );
        const missingObjectiveIds = validObjectiveIds.filter(
          (id) => !foundObjectiveIds.includes(id),
        );
        this.logger.warn(
          `The following objectives do not exist: ${missingObjectiveIds.join(', ')}`,
        );

        data.plan.objectiveIds = foundObjectiveIds;
      }
    } else {
      data.plan.objectiveIds = [];
    }

    if (data.plan.organizationId) {
      data.plan.organizationId =
        this.toObjectId(data.plan.organizationId)?.toString() || undefined;
    }

    if (data.plan.approvedBy) {
      data.plan.approvedBy =
        this.toObjectId(data.plan.approvedBy)?.toString() || undefined;
    }
  }

  private async createPlanFromImport(
    planData: PlanDto,
    userId: Types.ObjectId,
  ): Promise<PlanDto> {
    try {
      const goalIds = this.toObjectIdArray(planData.goalIds);
      const objectiveIds = this.toObjectIdArray(planData.objectiveIds);

      const newPlan = new Plan(
        `${planData.name} (Imported)`,
        planData.description || '',
        goalIds,
        objectiveIds,
        userId,
        planData.status || PlanStatus.DRAFT,
        planData.startDate,
        planData.endDate,
        this.toObjectId(planData.organizationId) || undefined,
      );

      const approvedById = this.toObjectId(planData.approvedBy);
      if (
        approvedById &&
        [PlanStatus.APPROVED, PlanStatus.ACTIVE].includes(planData.status)
      ) {
        newPlan.approvedBy = approvedById;
        newPlan.approvedDate =
          planData.approvedDate instanceof Date
            ? planData.approvedDate
            : new Date(planData.approvedDate ?? Date.now());
      }

      const createdPlan = await this.planRepository.create(newPlan);
      return PlanDto.fromEntity(createdPlan);
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new BadRequestException(`Validation error: ${error.message}`);
      } else if (
        (error instanceof Error && error.name === 'CastError') ||
        (error instanceof Error && error.message.includes('ObjectId'))
      ) {
        throw new BadRequestException(
          `Invalid ID format in imported data: ${error.message}`,
        );
      } else {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Error creating plan from import: ${errorMessage}`,
          errorStack,
        );
        throw error;
      }
    }
  }

  async exportAsPdf(planId: string): Promise<Buffer> {
    const data = await this.getCompletePlanData(planId);

    const html = this.generatePdfHtml(data);

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        displayHeaderFooter: true,
        headerTemplate:
          '<div style="font-size: 10px; margin-left: 20px; margin-right: 20px; width: 100%; text-align: center;"><span class="title"></span></div>',
        footerTemplate:
          '<div style="font-size: 10px; margin-left: 20px; margin-right: 20px; width: 100%; text-align: center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });

      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(
        `Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException('Failed to generate PDF');
    }
  }

  private generatePdfHtml(data: CompletePlanData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #2c3e50;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 120px 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .info-label {
              font-weight: bold;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-draft { background-color: #f0f0f0; color: #666; }
            .status-active { background-color: #e3f2fd; color: #1976d2; }
            .status-completed { background-color: #e8f5e9; color: #2e7d32; }
            .status-cancelled { background-color: #ffebee; color: #c62828; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${this.escapeHtml(data.plan.name)}</h1>
            <p>${this.escapeHtml(data.plan.description)}</p>
          </div>

          <div class="section">
            <div class="section-title">Plan Details</div>
            <div class="info-grid">
              <div class="info-label">Status:</div>
              <div><span class="status status-${data.plan.status.toLowerCase()}">${data.plan.status}</span></div>
              
              <div class="info-label">Start Date:</div>
              <div>${data.plan.startDate ? new Date(data.plan.startDate).toLocaleDateString() : 'Not set'}</div>
              
              <div class="info-label">End Date:</div>
              <div>${data.plan.endDate ? new Date(data.plan.endDate).toLocaleDateString() : 'Not set'}</div>
              
              ${
                data.plan.approvedDate
                  ? `
                <div class="info-label">Approved Date:</div>
                <div>${new Date(data.plan.approvedDate).toLocaleDateString()}</div>
              `
                  : ''
              }
            </div>
          </div>

          ${
            data.goals.length > 0
              ? `
            <div class="section">
              <div class="section-title">Goals</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.goals
                    .map(
                      (goal) => `
                    <tr>
                      <td>${this.escapeHtml(goal.name)}</td>
                      <td>${this.escapeHtml(goal.description || '')}</td>
                      <td><span class="status status-${goal.status.toLowerCase()}">${goal.status}</span></td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            data.objectives.length > 0
              ? `
            <div class="section">
              <div class="section-title">Objectives</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.objectives
                    .map(
                      (objective) => `
                    <tr>
                      <td>${this.escapeHtml(objective.name)}</td>
                      <td>${this.escapeHtml(objective.description || '')}</td>
                      <td><span class="status status-${objective.status.toLowerCase()}">${objective.status}</span></td>
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            data.questions.length > 0
              ? `
            <div class="section">
              <div class="section-title">Questions</div>
              <table>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Related Goal</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.questions
                    .map((question) => {
                      const relatedGoal = data.goals.find(
                        (g) => g.id === question.goalId,
                      );
                      return `
                      <tr>
                        <td>${this.escapeHtml(question.text)}</td>
                        <td>${this.escapeHtml(question.description || '')}</td>
                        <td>${question.priority}</td>
                        <td>${relatedGoal ? this.escapeHtml(relatedGoal.name) : ''}</td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            data.metrics.length > 0
              ? `
            <div class="section">
              <div class="section-title">Metrics</div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Related Question</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.metrics
                    .map((metric) => {
                      const relatedQuestion = data.questions.find(
                        (q) => q.id === metric.questionId,
                      );
                      return `
                      <tr>
                        <td>${this.escapeHtml(metric.name)}</td>
                        <td>${this.escapeHtml(metric.description || '')}</td>
                        <td>${metric.type}</td>
                        <td>${relatedQuestion ? this.escapeHtml(relatedQuestion.text) : ''}</td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }
        </body>
      </html>
    `;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
