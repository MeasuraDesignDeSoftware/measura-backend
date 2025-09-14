import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsMongoId,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MeasurementPlanStatus } from '../../../domain/measurement-plans/entities/measurement-plan.entity';
import { CreateObjectiveDto, UpdateObjectiveDto } from './objective.dto';

export class CreateMeasurementPlanDto {
  @ApiProperty({
    description: 'The name of the measurement plan',
    example: 'Q1 2024 Software Quality Plan',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Plan name is required' })
  @IsString({ message: 'Plan name must be a string' })
  @MaxLength(255, { message: 'Plan name must not exceed 255 characters' })
  planName: string;

  @ApiProperty({
    description: 'The ID of the associated project',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Associated project is required' })
  @IsMongoId({ message: 'Associated project must be a valid MongoDB ObjectId' })
  associatedProject: string;

  @ApiProperty({
    description: 'The person responsible for the plan',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Plan responsible is required' })
  @IsString({ message: 'Plan responsible must be a string' })
  @MaxLength(255, {
    message: 'Plan responsible must not exceed 255 characters',
  })
  planResponsible: string;

  @ApiProperty({
    description: 'The objectives for this plan',
    type: [CreateObjectiveDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Objectives must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateObjectiveDto)
  objectives?: CreateObjectiveDto[];
}

export class UpdateMeasurementPlanDto {
  @ApiProperty({
    description: 'The name of the measurement plan',
    example: 'Q1 2024 Software Quality Plan',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Plan name must be a string' })
  @MaxLength(255, { message: 'Plan name must not exceed 255 characters' })
  planName?: string;

  @ApiProperty({
    description: 'The ID of the associated project',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId({ message: 'Associated project must be a valid MongoDB ObjectId' })
  associatedProject?: string;

  @ApiProperty({
    description: 'The person responsible for the plan',
    example: 'John Doe',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Plan responsible must be a string' })
  @MaxLength(255, {
    message: 'Plan responsible must not exceed 255 characters',
  })
  planResponsible?: string;

  @ApiProperty({
    description: 'The status of the plan',
    enum: MeasurementPlanStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(MeasurementPlanStatus, {
    message: 'Status must be a valid plan status',
  })
  status?: MeasurementPlanStatus;

  @ApiProperty({
    description: 'The objectives for this plan',
    type: [UpdateObjectiveDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Objectives must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateObjectiveDto)
  objectives?: UpdateObjectiveDto[];
}

export class MeasurementPlanSummaryDto {
  @ApiProperty({ description: 'The unique identifier of the measurement plan' })
  id: string;

  @ApiProperty({ description: 'The name of the measurement plan' })
  planName: string;

  @ApiProperty({ description: 'The ID of the associated project' })
  associatedProject: string;

  @ApiProperty({ description: 'The person responsible for the plan' })
  planResponsible: string;

  @ApiProperty({
    description: 'The status of the plan',
    enum: MeasurementPlanStatus,
  })
  status: MeasurementPlanStatus;

  @ApiProperty({ description: 'The date when the plan was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The date when the plan was last updated' })
  updatedAt: Date;

  @ApiProperty({ description: 'The number of objectives' })
  objectivesCount: number;

  @ApiProperty({ description: 'The number of questions' })
  questionsCount: number;

  @ApiProperty({ description: 'The number of metrics' })
  metricsCount: number;

  @ApiProperty({ description: 'The number of measurements' })
  measurementsCount: number;

  @ApiProperty({ description: 'The progress percentage (0-100)' })
  progress: number;
}

export class MeasurementPlanResponseDto extends MeasurementPlanSummaryDto {
  @ApiProperty({ description: 'The ID of the organization' })
  organizationId: string;

  @ApiProperty({ description: 'The ID of the user who created the plan' })
  createdBy: string;

  @ApiProperty({ description: 'The objectives for this plan' })
  objectives: any[]; // Will be populated with full objective structure

  @ApiProperty({ description: 'The name of the associated project', required: false })
  associatedProjectName?: string;
}
