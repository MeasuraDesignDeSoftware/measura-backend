import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsMongoId,
  ArrayMinSize,
  IsDate,
  ValidateIf,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanStatus } from '../entities/plan.entity';
import { IsAfterDate } from '@app/shared/utils/validators/date-range.validator';

export class UpdatePlanDto {
  @ApiProperty({
    description:
      'The current version number of the plan (for optimistic locking)',
    example: 1,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  version: number;

  @ApiProperty({
    description: 'The name of the measurement plan',
    example: 'Q3 2023 Quality Improvement Plan',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the measurement plan',
    example:
      'Plan focused on improving code quality metrics across all services',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of goal IDs included in this plan',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  goalIds?: string[];

  @ApiProperty({
    description: 'Array of objective IDs included in this plan',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  objectiveIds?: string[];

  @ApiProperty({
    description: 'Status of the plan',
    enum: PlanStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiProperty({
    description: 'Plan start date',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    description: 'Plan end date',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ValidateIf((o: UpdatePlanDto) => o.startDate != null)
  @IsAfterDate('startDate', { message: 'End date must be after start date' })
  endDate?: Date;

  @ApiProperty({
    description: 'Optional organization ID associated with this plan',
    example: '507f1f77bcf86cd799439015',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description:
      'User ID who approved the plan (required for APPROVED or ACTIVE status)',
    example: '507f1f77bcf86cd799439016',
    required: false,
  })
  @ValidateIf(
    (o: UpdatePlanDto) =>
      o.status === PlanStatus.APPROVED || o.status === PlanStatus.ACTIVE,
  )
  @IsMongoId()
  @IsNotEmpty({
    message: 'approvedBy is required when plan is approved or active',
  })
  approvedBy?: string;

  @ApiProperty({
    description:
      'Date when the plan was approved (required for APPROVED or ACTIVE status)',
    required: false,
  })
  @ValidateIf(
    (o: UpdatePlanDto) =>
      o.status === PlanStatus.APPROVED || o.status === PlanStatus.ACTIVE,
  )
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({
    message: 'approvedDate is required when plan is approved or active',
  })
  approvedDate?: Date;
}
