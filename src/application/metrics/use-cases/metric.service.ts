import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  IMetricRepository,
  METRIC_REPOSITORY,
} from '@domain/metrics/interfaces/metric.repository.interface';
import { CreateMetricDto } from '@domain/metrics/dtos/create-metric.dto';
import { UpdateMetricDto } from '@domain/metrics/dtos/update-metric.dto';
import { MetricDto } from '@domain/metrics/dtos/metric.dto';

@Injectable()
export class MetricService {
  constructor(
    @Inject(METRIC_REPOSITORY)
    private readonly metricRepository: IMetricRepository,
  ) {}

  async createMetric(
    createMetricDto: CreateMetricDto,
    userId: string,
  ): Promise<MetricDto> {
    const metric = await this.metricRepository.create({
      ...createMetricDto,
      createdBy: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(createMetricDto.questionId),
    });
    return MetricDto.fromEntity(metric);
  }

  async getMetricById(id: string): Promise<MetricDto> {
    const metric = await this.metricRepository.findById(id);
    if (!metric) {
      throw new NotFoundException(`Metric with ID ${id} not found`);
    }
    return MetricDto.fromEntity(metric);
  }

  async getMetricsByQuestionId(questionId: string): Promise<MetricDto[]> {
    const metrics = await this.metricRepository.findByQuestionId(questionId);
    return metrics.map((metric) => MetricDto.fromEntity(metric));
  }

  async getMetricsByGoalId(goalId: string): Promise<MetricDto[]> {
    const metrics = await this.metricRepository.findByGoalId(goalId);
    return metrics.map((metric) => MetricDto.fromEntity(metric));
  }

  async getMetricsByUserId(userId: string): Promise<MetricDto[]> {
    const metrics = await this.metricRepository.findByCreatedBy(userId);
    return metrics.map((metric) => MetricDto.fromEntity(metric));
  }

  async getMetricsByIds(ids: string[]): Promise<MetricDto[]> {
    const metrics = await this.metricRepository.findByIds(ids);
    return metrics.map((metric) => MetricDto.fromEntity(metric));
  }

  async updateMetric(
    id: string,
    updateMetricDto: UpdateMetricDto,
  ): Promise<MetricDto> {
    const existingMetric = await this.metricRepository.findById(id);
    if (!existingMetric) {
      throw new NotFoundException(`Metric with ID ${id} not found`);
    }

    const updateData: Record<string, any> = {};

    if (updateMetricDto.name !== undefined)
      updateData.name = updateMetricDto.name;
    if (updateMetricDto.description !== undefined)
      updateData.description = updateMetricDto.description;
    if (updateMetricDto.type !== undefined)
      updateData.type = updateMetricDto.type;
    if (updateMetricDto.unit !== undefined)
      updateData.unit = updateMetricDto.unit;
    if (updateMetricDto.customUnitLabel !== undefined)
      updateData.customUnitLabel = updateMetricDto.customUnitLabel;
    if (updateMetricDto.formula !== undefined)
      updateData.formula = updateMetricDto.formula;
    if (updateMetricDto.targetValue !== undefined)
      updateData.targetValue = updateMetricDto.targetValue;
    if (updateMetricDto.frequency !== undefined)
      updateData.frequency = updateMetricDto.frequency;

    if (updateMetricDto.questionId) {
      updateData.questionId = new Types.ObjectId(updateMetricDto.questionId);
    }

    const updatedMetric = await this.metricRepository.update(id, updateData);
    if (!updatedMetric) {
      throw new NotFoundException(`Failed to update metric with ID ${id}`);
    }
    return MetricDto.fromEntity(updatedMetric);
  }

  async deleteMetric(id: string): Promise<boolean> {
    const existingMetric = await this.metricRepository.findById(id);
    if (!existingMetric) {
      throw new NotFoundException(`Metric with ID ${id} not found`);
    }

    return this.metricRepository.delete(id);
  }
}
