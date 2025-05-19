import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsMongoId,
  ValidateIf,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MetricType, MetricUnit } from '../entities/metric.entity';
import { Type } from 'class-transformer';
export class CreateMetricDto {
  @ApiProperty({
    description: 'The name of the metric',
    example: 'Defect Density',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The description of the metric',
    example: 'The number of defects per 1000 lines of code',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'The ID of the question this metric is associated with',
    example: '60d21b4667d0d1d8ef9aa87b',
  })
  @IsNotEmpty()
  @IsMongoId()
  questionId: string;

  @ApiProperty({
    description: 'The type of the metric',
    enum: MetricType,
    default: MetricType.QUANTITATIVE,
  })
  @IsEnum(MetricType)
  type: MetricType = MetricType.QUANTITATIVE;

  @ApiProperty({
    description: 'The unit of measurement for the metric',
    enum: MetricUnit,
    default: MetricUnit.COUNT,
  })
  @IsEnum(MetricUnit)
  unit: MetricUnit = MetricUnit.COUNT;

  @ApiProperty({
    description: 'Custom unit label (used when unit is CUSTOM)',
    example: 'defects/KLOC',
    required: false,
  })
  @ValidateIf((o: CreateMetricDto) => o.unit === MetricUnit.CUSTOM)
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  customUnitLabel?: string;

  @ApiProperty({
    description: 'The formula or method for collecting the metric',
    example: 'Count of defects / (Lines of Code / 1000)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  formula?: string;

  @ApiProperty({
    description: 'The target or threshold value for this metric',
    example: 5,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetValue?: number;

  @ApiProperty({
    description: 'The frequency of measurement (e.g., daily, weekly, monthly)',
    example: 'weekly',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  frequency?: string;
}
