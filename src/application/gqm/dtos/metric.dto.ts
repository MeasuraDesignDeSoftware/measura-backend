import { ApiProperty } from '@nestjs/swagger';
import {
  Metric,
  MetricType,
  MetricUnit,
} from '@domain/gqm/entities/metric.entity';

export class MetricDto {
  @ApiProperty({
    description: 'The unique identifier of the metric',
    example: '60d21b4667d0d1d8ef9aa87c',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the metric',
    example: 'Defect Density',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the metric',
    example: 'The number of defects per 1000 lines of code',
  })
  description: string;

  @ApiProperty({
    description: 'The ID of the question this metric is associated with',
    example: '60d21b4667d0d1d8ef9aa87b',
  })
  questionId: string;

  @ApiProperty({
    description: 'The type of the metric',
    enum: MetricType,
    example: MetricType.QUANTITATIVE,
  })
  type: MetricType;

  @ApiProperty({
    description: 'The unit of measurement for the metric',
    enum: MetricUnit,
    example: MetricUnit.COUNT,
  })
  unit: MetricUnit;

  @ApiProperty({
    description: 'Custom unit label (used when unit is CUSTOM)',
    example: 'defects/KLOC',
    required: false,
  })
  customUnitLabel?: string;

  @ApiProperty({
    description: 'The formula or method for collecting the metric',
    example: 'Count of defects / (Lines of Code / 1000)',
    required: false,
  })
  formula?: string;

  @ApiProperty({
    description: 'The target or threshold value for this metric',
    example: 5,
    required: false,
  })
  targetValue?: number;

  @ApiProperty({
    description: 'The frequency of measurement (e.g., daily, weekly, monthly)',
    example: 'weekly',
    required: false,
  })
  frequency?: string;

  @ApiProperty({
    description: 'The ID of the user who created the metric',
    example: '60d21b4667d0d1d8ef9aa87e',
  })
  createdBy: string;

  @ApiProperty({
    description: 'The date when the metric was created',
    example: '2023-06-19T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the metric was last updated',
    example: '2023-06-20T14:30:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<MetricDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(metric: Metric): MetricDto {
    return new MetricDto({
      id: metric._id?.toString(),
      name: metric.name,
      description: metric.description,
      questionId: metric.questionId?.toString(),
      type: metric.type,
      unit: metric.unit,
      customUnitLabel: metric.customUnitLabel,
      formula: metric.formula,
      targetValue: metric.targetValue,
      frequency: metric.frequency,
      createdBy: metric.createdBy?.toString(),
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    });
  }
}
