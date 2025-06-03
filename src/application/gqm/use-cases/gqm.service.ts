import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IGoalRepository,
  GOAL_REPOSITORY,
} from '@domain/gqm/interfaces/goal.repository.interface';
import {
  IQuestionRepository,
  QUESTION_REPOSITORY,
} from '@domain/gqm/interfaces/question.repository.interface';
import {
  IMetricRepository,
  METRIC_REPOSITORY,
} from '@domain/gqm/interfaces/metric.repository.interface';
import { Goal } from '@domain/gqm/entities/goal.entity';
import { Question } from '@domain/gqm/entities/question.entity';
import { Metric } from '@domain/gqm/entities/metric.entity';
import { GoalDto } from '@application/gqm/dtos/goal.dto';
import { QuestionDto } from '@application/gqm/dtos/question.dto';
import { MetricDto } from '@application/gqm/dtos/metric.dto';
import { Types } from 'mongoose';

export interface GQMTreeNode {
  goal: GoalDto;
  questions: Array<{
    question: QuestionDto;
    metrics: MetricDto[];
  }>;
}

@Injectable()
export class GQMService {
  constructor(
    @Inject(GOAL_REPOSITORY)
    private readonly goalRepository: IGoalRepository,
    @Inject(QUESTION_REPOSITORY)
    private readonly questionRepository: IQuestionRepository,
    @Inject(METRIC_REPOSITORY)
    private readonly metricRepository: IMetricRepository,
  ) {}

  private assertValidObjectId(id: string, label: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} ID format: ${id}`);
    }
  }

  async validateGoal(goalId: string): Promise<Goal> {
    this.assertValidObjectId(goalId, 'goal');
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }
    return goal;
  }

  async validateQuestion(questionId: string): Promise<Question> {
    this.assertValidObjectId(questionId, 'question');
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    return question;
  }

  async validateMetric(metricId: string): Promise<Metric> {
    this.assertValidObjectId(metricId, 'metric');
    const metric = await this.metricRepository.findById(metricId);
    if (!metric) {
      throw new NotFoundException(`Metric with ID ${metricId} not found`);
    }
    return metric;
  }

  async validateQuestionHierarchy(
    goalId: string,
    questionId: string,
  ): Promise<void> {
    const [goal, question] = await Promise.all([
      this.validateGoal(goalId),
      this.validateQuestion(questionId),
    ]);

    if (question.goalId.toString() !== goal._id.toString()) {
      throw new BadRequestException(
        `Question ${questionId} does not belong to goal ${goalId}`,
      );
    }
  }

  async validateMetricHierarchy(
    questionId: string,
    metricId: string,
  ): Promise<void> {
    const [question, metric] = await Promise.all([
      this.validateQuestion(questionId),
      this.validateMetric(metricId),
    ]);

    if (metric.questionId.toString() !== question._id.toString()) {
      throw new BadRequestException(
        `Metric ${metricId} does not belong to question ${questionId}`,
      );
    }

    await this.validateQuestionHierarchy(
      question.goalId.toString(),
      question._id.toString(),
    );
  }

  async getGQMTree(goalId: string): Promise<GQMTreeNode> {
    const goal = await this.validateGoal(goalId);
    const questions = await this.questionRepository.findByGoalId(goalId);

    const questionMetricsPromises = questions.map(async (question) => {
      const metrics = await this.metricRepository.findByQuestionId(
        question._id.toString(),
      );
      return {
        question: QuestionDto.fromEntity(question),
        metrics: metrics.map((metric) => MetricDto.fromEntity(metric)),
      };
    });

    const questionMetrics = await Promise.all(questionMetricsPromises);

    return {
      goal: GoalDto.fromEntity(goal),
      questions: questionMetrics,
    };
  }

  async getAllGQMTrees(userId: string): Promise<GQMTreeNode[]> {
    this.assertValidObjectId(userId, 'user');
    const goals = await this.goalRepository.findByCreatedBy(userId);

    const gqmTreesPromises = goals.map((goal) =>
      this.getGQMTree(goal._id.toString()),
    );
    return Promise.all(gqmTreesPromises);
  }

  async checkQuestionDependencies(questionId: string): Promise<void> {
    this.assertValidObjectId(questionId, 'question');
    const metrics = await this.metricRepository.findByQuestionId(questionId);
    if (metrics.length > 0) {
      throw new BadRequestException(
        `Cannot delete question with ID ${questionId} because it has ${metrics.length} associated metric(s)`,
      );
    }
  }

  async checkGoalDependencies(goalId: string): Promise<void> {
    this.assertValidObjectId(goalId, 'goal');
    const questions = await this.questionRepository.findByGoalId(goalId);
    if (questions.length > 0) {
      throw new BadRequestException(
        `Cannot delete goal with ID ${goalId} because it has ${questions.length} associated question(s)`,
      );
    }
  }
}
