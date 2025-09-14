import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMeasurementDto, UpdateMeasurementDto } from './measurement.dto';

export class CreateMetricDto {
  @ApiProperty({
    description: 'The name of the metric',
    example: 'Code Coverage',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Metric name is required' })
  @IsString({ message: 'Metric name must be a string' })
  @MaxLength(50, { message: 'Metric name must not exceed 50 characters' })
  metricName: string;

  @ApiProperty({
    description: 'The description of the metric',
    example: 'Percentage of code covered by tests',
    maxLength: 400,
  })
  @IsNotEmpty({ message: 'Metric description is required' })
  @IsString({ message: 'Metric description must be a string' })
  @MaxLength(400, {
    message: 'Metric description must not exceed 400 characters',
  })
  metricDescription: string;

  @ApiProperty({
    description: 'The mnemonic for the metric',
    example: 'CC',
    maxLength: 10,
  })
  @IsNotEmpty({ message: 'Metric mnemonic is required' })
  @IsString({ message: 'Metric mnemonic must be a string' })
  @MaxLength(10, { message: 'Metric mnemonic must not exceed 10 characters' })
  metricMnemonic: string;

  @ApiProperty({
    description: 'The formula for calculating the metric',
    example: '(covered_lines / total_lines) * 100',
  })
  @IsNotEmpty({ message: 'Metric formula is required' })
  @IsString({ message: 'Metric formula must be a string' })
  metricFormula: string;

  @ApiProperty({
    description: 'The control range for the metric [min, max]',
    example: [0, 100],
    type: [Number],
  })
  @IsNotEmpty({ message: 'Metric control range is required' })
  @IsArray({ message: 'Metric control range must be an array' })
  @ArrayMinSize(2, { message: 'Control range must have exactly 2 values' })
  @ArrayMaxSize(2, { message: 'Control range must have exactly 2 values' })
  @IsNumber({}, { each: true, message: 'Control range values must be numbers' })
  metricControlRange: [number, number];

  @ApiProperty({
    description: 'The analysis procedure for the metric',
    example: 'Weekly automated analysis',
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Analysis procedure is required' })
  @IsString({ message: 'Analysis procedure must be a string' })
  @MaxLength(1000, {
    message: 'Analysis procedure must not exceed 1000 characters',
  })
  analysisProcedure: string;

  @ApiProperty({
    description: 'The frequency of analysis',
    example: 'Weekly',
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'Analysis frequency is required' })
  @IsString({ message: 'Analysis frequency must be a string' })
  @MaxLength(50, {
    message: 'Analysis frequency must not exceed 50 characters',
  })
  analysisFrequency: string;

  @ApiProperty({
    description: 'The person responsible for analysis',
    example: 'QA Team',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Analysis responsible must be a string' })
  @MaxLength(255, {
    message: 'Analysis responsible must not exceed 255 characters',
  })
  analysisResponsible?: string;

  @ApiProperty({
    description: 'The measurements for this metric (at least one required)',
    type: [CreateMeasurementDto],
  })
  @IsNotEmpty({ message: 'Measurements are required' })
  @IsArray({ message: 'Measurements must be an array' })
  @ArrayNotEmpty({ message: 'At least one measurement is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateMeasurementDto)
  measurements: CreateMeasurementDto[];
}

export class UpdateMetricDto {
  @ApiProperty({
    description: 'The name of the metric',
    example: 'Code Coverage',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Metric name must be a string' })
  @MaxLength(50, { message: 'Metric name must not exceed 50 characters' })
  metricName?: string;

  @ApiProperty({
    description: 'The description of the metric',
    example: 'Percentage of code covered by tests',
    maxLength: 400,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Metric description must be a string' })
  @MaxLength(400, {
    message: 'Metric description must not exceed 400 characters',
  })
  metricDescription?: string;

  @ApiProperty({
    description: 'The mnemonic for the metric',
    example: 'CC',
    maxLength: 10,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Metric mnemonic must be a string' })
  @MaxLength(10, { message: 'Metric mnemonic must not exceed 10 characters' })
  metricMnemonic?: string;

  @ApiProperty({
    description: 'The formula for calculating the metric',
    example: '(covered_lines / total_lines) * 100',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Metric formula must be a string' })
  metricFormula?: string;

  @ApiProperty({
    description: 'The control range for the metric [min, max]',
    example: [0, 100],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Metric control range must be an array' })
  @ArrayMinSize(2, { message: 'Control range must have exactly 2 values' })
  @ArrayMaxSize(2, { message: 'Control range must have exactly 2 values' })
  @IsNumber({}, { each: true, message: 'Control range values must be numbers' })
  metricControlRange?: [number, number];

  @ApiProperty({
    description: 'The analysis procedure for the metric',
    example: 'Weekly automated analysis',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Analysis procedure must be a string' })
  @MaxLength(1000, {
    message: 'Analysis procedure must not exceed 1000 characters',
  })
  analysisProcedure?: string;

  @ApiProperty({
    description: 'The frequency of analysis',
    example: 'Weekly',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Analysis frequency must be a string' })
  @MaxLength(50, {
    message: 'Analysis frequency must not exceed 50 characters',
  })
  analysisFrequency?: string;

  @ApiProperty({
    description: 'The person responsible for analysis',
    example: 'QA Team',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Analysis responsible must be a string' })
  @MaxLength(255, {
    message: 'Analysis responsible must not exceed 255 characters',
  })
  analysisResponsible?: string;

  @ApiProperty({
    description: 'The measurements for this metric',
    type: [UpdateMeasurementDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Measurements must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateMeasurementDto)
  measurements?: UpdateMeasurementDto[];
}
