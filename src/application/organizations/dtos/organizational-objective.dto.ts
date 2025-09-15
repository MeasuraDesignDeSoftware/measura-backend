import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ObjectivePriority,
  ObjectiveStatus,
} from '@domain/organizations/entities/organization.entity';

export class CreateOrganizationalObjectiveDto {
  @ApiProperty({
    description: 'The title of the organizational objective',
    example: 'Increase market share by 25%',
    minLength: 3,
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @ApiProperty({
    description: 'The detailed description of the organizational objective',
    example: 'Expand our customer base and increase revenue through strategic marketing initiatives and product improvements',
    minLength: 10,
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'The priority level of the objective',
    enum: ObjectivePriority,
    example: ObjectivePriority.HIGH,
  })
  @IsEnum(ObjectivePriority, { message: 'Priority must be a valid priority level' })
  priority: ObjectivePriority;

  @ApiProperty({
    description: 'The current status of the objective',
    enum: ObjectiveStatus,
    example: ObjectiveStatus.PLANNING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ObjectiveStatus, { message: 'Status must be a valid status' })
  status?: ObjectiveStatus;

  @ApiProperty({
    description: 'The target completion date for the objective',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Target date must be a valid date' })
  @Type(() => Date)
  targetDate?: Date;

  @ApiProperty({
    description: 'The progress percentage of the objective (0-100)',
    example: 25,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  @Min(0, { message: 'Progress cannot be less than 0' })
  @Max(100, { message: 'Progress cannot be greater than 100' })
  progress?: number;
}

export class UpdateOrganizationalObjectiveDto {
  @ApiProperty({
    description: 'The unique identifier of the objective (for updates)',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  _id?: string;

  @ApiProperty({
    description: 'The title of the organizational objective',
    example: 'Increase market share by 30%',
    minLength: 3,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiProperty({
    description: 'The detailed description of the organizational objective',
    example: 'Updated strategy to expand customer base with enhanced digital marketing',
    minLength: 10,
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'The priority level of the objective',
    enum: ObjectivePriority,
    example: ObjectivePriority.CRITICAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ObjectivePriority, { message: 'Priority must be a valid priority level' })
  priority?: ObjectivePriority;

  @ApiProperty({
    description: 'The current status of the objective',
    enum: ObjectiveStatus,
    example: ObjectiveStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(ObjectiveStatus, { message: 'Status must be a valid status' })
  status?: ObjectiveStatus;

  @ApiProperty({
    description: 'The target completion date for the objective',
    example: '2025-03-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Target date must be a valid date' })
  @Type(() => Date)
  targetDate?: Date;

  @ApiProperty({
    description: 'The completion date of the objective (when status is COMPLETED)',
    example: '2024-11-15T10:30:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate({ message: 'Completion date must be a valid date' })
  @Type(() => Date)
  completionDate?: Date;

  @ApiProperty({
    description: 'The progress percentage of the objective (0-100)',
    example: 65,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Progress must be a number' })
  @Min(0, { message: 'Progress cannot be less than 0' })
  @Max(100, { message: 'Progress cannot be greater than 100' })
  progress?: number;
}

export class OrganizationalObjectiveResponseDto {
  @ApiProperty({ description: 'The unique identifier of the objective' })
  _id: string;

  @ApiProperty({ description: 'The title of the objective' })
  title: string;

  @ApiProperty({ description: 'The description of the objective' })
  description: string;

  @ApiProperty({ description: 'The priority level', enum: ObjectivePriority })
  priority: ObjectivePriority;

  @ApiProperty({ description: 'The current status', enum: ObjectiveStatus })
  status: ObjectiveStatus;

  @ApiProperty({ description: 'The target completion date', required: false })
  targetDate?: Date;

  @ApiProperty({ description: 'The completion date', required: false })
  completionDate?: Date;

  @ApiProperty({ description: 'The progress percentage (0-100)', required: false })
  progress?: number;
}