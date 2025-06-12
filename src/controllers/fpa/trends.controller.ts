import {
  Controller,
  Get,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/utils/guards/jwt-auth.guard';
import {
  ESTIMATE_REPOSITORY,
  IEstimateRepository,
} from '@domain/fpa/interfaces/estimate.repository.interface';
import {
  TrendAnalysisService,
  TrendMetric,
} from '@domain/fpa/services/trend-analysis.service';
import { Estimate } from '@domain/fpa/entities/estimate.entity';

interface TrendResult {
  trend: string;
  percentageChange: number;
  data: {
    estimateId: string;
    name: string;
    version: number;
    date: string;
    metric: number;
  }[];
}

@ApiTags('estimate-trends')
@Controller('estimates/trends')
@UseGuards(JwtAuthGuard)
export class TrendsController {
  constructor(
    @Inject(ESTIMATE_REPOSITORY)
    private readonly estimateRepository: IEstimateRepository,
    private readonly trendAnalysisService: TrendAnalysisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Analyze trends in function point estimates' })
  @ApiQuery({
    name: 'projectId',
    description: 'Project ID to filter estimates',
    required: false,
  })
  @ApiQuery({
    name: 'metric',
    description:
      'Metric to analyze: fp (function points), effort (effort hours), or vaf (value adjustment factor)',
    required: false,
    enum: ['fp', 'effort', 'vaf'],
  })
  @ApiResponse({
    status: 200,
    description: 'Trend analysis performed successfully',
  })
  async analyzeTrends(
    @Query('projectId') projectId?: string,
    @Query('metric') metricType: string = 'fp',
  ): Promise<TrendResult> {
    try {
      // Get estimates, filtered by project if specified
      let estimates = projectId
        ? await this.estimateRepository.findByProject(projectId)
        : await this.estimateRepository.findAll();

      // Ensure we have estimates to analyze
      if (!estimates || estimates.length === 0) {
        throw new NotFoundException('No estimates found for trend analysis');
      }

      // Sort by version
      estimates = estimates.sort((a, b) => a.version - b.version);

      // Map metric type to TrendMetric enum
      let metric: TrendMetric;
      switch (metricType.toLowerCase()) {
        case 'effort':
          metric = TrendMetric.EFFORT;
          break;
        case 'vaf':
          metric = TrendMetric.VAF;
          break;
        case 'fp':
        default:
          metric = TrendMetric.ADJUSTED_FP;
          break;
      }

      // Perform trend analysis
      const trendResult = this.trendAnalysisService.analyzeTrend(
        estimates,
        metric,
      );

      // Format the response
      return {
        trend: trendResult.trend,
        percentageChange: Number(trendResult.percentageChange.toFixed(2)),
        data: estimates.map((est) => ({
          estimateId: est._id.toString(),
          name: est.name,
          version: est.version,
          date: est.updatedAt.toISOString().split('T')[0],
          metric: this.getMetricValue(est, metric),
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to analyze trends: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private getMetricValue(estimate: Estimate, metric: TrendMetric): number {
    switch (metric) {
      case TrendMetric.EFFORT:
        return estimate.estimatedEffortHours || 0;
      case TrendMetric.VAF:
        return estimate.valueAdjustmentFactor || 1.0;
      case TrendMetric.ADJUSTED_FP:
      default:
        return estimate.adjustedFunctionPoints || 0;
    }
  }
}
