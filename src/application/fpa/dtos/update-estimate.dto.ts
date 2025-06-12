import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsPositive,
} from 'class-validator';
import { EstimateStatus } from '@domain/fpa/entities/estimate.entity';

export class UpdateEstimateDto {
  @ApiProperty({
    description: 'The name of the estimate',
    example: 'Updated ERP System Function Point Analysis',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'The description of the estimate',
    example: 'Updated function point analysis with more accurate counts',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'The status of the estimate',
    enum: EstimateStatus,
    example: EstimateStatus.FINALIZED,
    required: false,
  })
  @IsOptional()
  @IsEnum(EstimateStatus)
  status?: EstimateStatus;

  // Enhanced project configuration fields
  @ApiProperty({
    description: 'Average daily working hours per person',
    example: 8,
    minimum: 1,
    maximum: 24,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  averageDailyWorkingHours?: number;

  @ApiProperty({
    description: 'Number of people working on the project',
    example: 4,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  teamSize?: number;

  @ApiProperty({
    description: 'Hourly rate in Brazilian Reais (BRL)',
    example: 150.0,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  hourlyRateBRL?: number;

  @ApiProperty({
    description: 'The productivity factor (hours per function point)',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  productivityFactor?: number;

  @ApiProperty({
    description: 'References to Internal Logical Files (ILFs)',
    example: ['60a1e2c7b9b5a50d944b1e38', '60a1e2c7b9b5a50d944b1e39'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  internalLogicalFiles?: string[];

  @ApiProperty({
    description: 'References to External Interface Files (EIFs)',
    example: ['60a1e2c7b9b5a50d944b1e40', '60a1e2c7b9b5a50d944b1e41'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalInterfaceFiles?: string[];

  @ApiProperty({
    description: 'References to External Inputs (EIs)',
    example: ['60a1e2c7b9b5a50d944b1e42', '60a1e2c7b9b5a50d944b1e43'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalInputs?: string[];

  @ApiProperty({
    description: 'References to External Outputs (EOs)',
    example: ['60a1e2c7b9b5a50d944b1e44', '60a1e2c7b9b5a50d944b1e45'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalOutputs?: string[];

  @ApiProperty({
    description: 'References to External Queries (EQs)',
    example: ['60a1e2c7b9b5a50d944b1e46', '60a1e2c7b9b5a50d944b1e47'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalQueries?: string[];

  @ApiProperty({
    description:
      'The General System Characteristics values (0-5 for each of the 14 GSCs)',
    example: [3, 4, 2, 3, 4, 3, 3, 3, 2, 4, 3, 3, 2, 4],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(5, { each: true })
  @ArrayMinSize(14)
  @ArrayMaxSize(14)
  generalSystemCharacteristics?: number[];

  @ApiProperty({
    description: 'Optional notes about the estimate',
    example: 'Updated with additional details from the business analyst',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
