import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@interfaces/api/guards/jwt-auth.guard';
import { GetUser } from '@interfaces/api/decorators/get-user.decorator';
import { MetricService } from '@application/metrics/use-cases/metric.service';
import { CreateMetricDto } from '@domain/metrics/dtos/create-metric.dto';
import { UpdateMetricDto } from '@domain/metrics/dtos/update-metric.dto';
import { MetricDto } from '@domain/metrics/dtos/metric.dto';

interface RequestUser {
  id: string;
  [key: string]: any;
}

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MetricsController {
  constructor(private readonly metricService: MetricService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new metric' })
  @ApiResponse({
    status: 201,
    description: 'Metric created successfully',
    type: MetricDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createMetric(
    @Body() createMetricDto: CreateMetricDto,
    @GetUser() user: RequestUser,
  ): Promise<MetricDto> {
    try {
      const result = await this.metricService.createMetric(
        createMetricDto,
        user.id,
      );
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create metric');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get metrics based on query parameters' })
  @ApiQuery({
    name: 'questionId',
    required: false,
    description: 'Filter metrics by question ID',
  })
  @ApiQuery({
    name: 'goalId',
    required: false,
    description: 'Filter metrics by goal ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    type: [MetricDto],
  })
  async getMetrics(
    @Query('questionId') questionId?: string,
    @Query('goalId') goalId?: string,
    @GetUser() user?: RequestUser,
  ): Promise<MetricDto[]> {
    try {
      if (questionId) {
        const metrics =
          await this.metricService.getMetricsByQuestionId(questionId);
        return metrics;
      } else if (goalId) {
        const metrics = await this.metricService.getMetricsByGoalId(goalId);
        return metrics;
      } else if (user?.id) {
        const metrics = await this.metricService.getMetricsByUserId(user.id);
        return metrics;
      }
      return [];
    } catch (_) {
      throw new InternalServerErrorException('Failed to retrieve metrics');
    }
  }

  @Get('bulk')
  @ApiOperation({ summary: 'Get multiple metrics by IDs' })
  @ApiQuery({ name: 'ids', description: 'Comma-separated list of metric IDs' })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    type: [MetricDto],
  })
  async getMetricsByIds(@Query('ids') ids: string): Promise<MetricDto[]> {
    try {
      const metricIds = ids.split(',').map((id) => id.trim());
      const metrics = await this.metricService.getMetricsByIds(metricIds);
      return metrics;
    } catch (_) {
      throw new InternalServerErrorException('Failed to retrieve metrics');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a metric by ID' })
  @ApiParam({ name: 'id', description: 'Metric ID' })
  @ApiResponse({
    status: 200,
    description: 'Metric retrieved successfully',
    type: MetricDto,
  })
  @ApiResponse({ status: 404, description: 'Metric not found' })
  async getMetricById(@Param('id') id: string): Promise<MetricDto> {
    try {
      const metric = await this.metricService.getMetricById(id);
      return metric;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve metric');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a metric' })
  @ApiParam({ name: 'id', description: 'Metric ID' })
  @ApiResponse({
    status: 200,
    description: 'Metric updated successfully',
    type: MetricDto,
  })
  @ApiResponse({ status: 404, description: 'Metric not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateMetric(
    @Param('id') id: string,
    @Body() updateMetricDto: UpdateMetricDto,
  ): Promise<MetricDto> {
    try {
      const updatedMetric = await this.metricService.updateMetric(
        id,
        updateMetricDto,
      );
      return updatedMetric;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update metric');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a metric' })
  @ApiParam({ name: 'id', description: 'Metric ID' })
  @ApiResponse({ status: 200, description: 'Metric deleted successfully' })
  @ApiResponse({ status: 404, description: 'Metric not found' })
  async deleteMetric(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      const success = await this.metricService.deleteMetric(id);
      return { success };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete metric');
    }
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple metrics at once' })
  @ApiResponse({
    status: 201,
    description: 'Metrics created successfully',
    type: [MetricDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createBulkMetrics(
    @Body() createMetricDtos: CreateMetricDto[],
    @GetUser() user: RequestUser,
  ): Promise<MetricDto[]> {
    try {
      const metricPromises = createMetricDtos.map((dto) =>
        this.metricService.createMetric(dto, user.id),
      );
      const results = await Promise.all(metricPromises);
      return results;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create metrics in bulk',
      );
    }
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Delete multiple metrics at once' })
  @ApiQuery({
    name: 'ids',
    description: 'Comma-separated list of metric IDs to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics deleted successfully',
    type: Object,
  })
  async deleteBulkMetrics(
    @Query('ids') ids: string,
  ): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const metricIds = ids.split(',').map((id) => id.trim());
      const deleteResults = await Promise.all(
        metricIds.map((id) => this.metricService.deleteMetric(id)),
      );

      const successCount = deleteResults.filter(Boolean).length;

      return {
        success: successCount > 0,
        deletedCount: successCount,
      };
    } catch (_) {
      throw new InternalServerErrorException(
        'Failed to delete metrics in bulk',
      );
    }
  }
}
