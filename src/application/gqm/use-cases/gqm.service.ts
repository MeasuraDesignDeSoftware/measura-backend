import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IGoalRepository,
  GOAL_REPOSITORY,
} from '@domain/goals/interfaces/goal.repository.interface';
import {
  IQuestionRepository,
  QUESTION_REPOSITORY,
} from '@domain/questions/interfaces/question.repository.interface';
import {
  IMetricRepository,
  METRIC_REPOSITORY,
} from '@domain/metrics/interfaces/metric.repository.interface';
import { Goal } from '@domain/goals/entities/goal.entity';
import { Question } from '@domain/questions/entities/question.entity';
import { Metric } from '@domain/metrics/entities/metric.entity';
import { GoalDto } from '@domain/goals/dtos/goal.dto';
import { QuestionDto } from '@domain/questions/dtos/question.dto';
import { MetricDto } from '@domain/metrics/dtos/metric.dto';

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

  // Validate if a goal exists
  async validateGoal(goalId: string): Promise<Goal> {
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }
    return goal;
  }

  // Validate if a question exists
  async validateQuestion(questionId: string): Promise<Question> {
    const question = await this.questionRepository.findById(questionId);
    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }
    return question;
  }

  // Validate if a metric exists
  async validateMetric(metricId: string): Promise<Metric> {
    const metric = await this.metricRepository.findById(metricId);
    if (!metric) {
      throw new NotFoundException(`Metric with ID ${metricId} not found`);
    }
    return metric;
  }

  // Validate the GQM hierarchy for a new question
  async validateQuestionHierarchy(goalId: string): Promise<void> {
    await this.validateGoal(goalId);
    // Add any additional validation rules here
  }

  // Validate the GQM hierarchy for a new metric
  async validateMetricHierarchy(questionId: string): Promise<void> {
    const question = await this.validateQuestion(questionId);
    await this.validateGoal(question.goalId.toString());
    // Add any additional validation rules here
  }

  // Get the complete GQM hierarchy for a goal
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

  // Get all GQM trees for a user
  async getAllGQMTrees(userId: string): Promise<GQMTreeNode[]> {
    const goals = await this.goalRepository.findByCreatedBy(userId);

    const gqmTreesPromises = goals.map((goal) =>
      this.getGQMTree(goal._id.toString()),
    );
    return Promise.all(gqmTreesPromises);
  }

  // Check if removing a question would orphan metrics
  async checkQuestionDependencies(questionId: string): Promise<void> {
    const metrics = await this.metricRepository.findByQuestionId(questionId);
    if (metrics.length > 0) {
      throw new BadRequestException(
        `Cannot delete question with ID ${questionId} because it has ${metrics.length} associated metric(s)`,
      );
    }
  }

  // Check if removing a goal would orphan questions
  async checkGoalDependencies(goalId: string): Promise<void> {
    const questions = await this.questionRepository.findByGoalId(goalId);
    if (questions.length > 0) {
      throw new BadRequestException(
        `Cannot delete goal with ID ${goalId} because it has ${questions.length} associated question(s)`,
      );
    }
  }
}
