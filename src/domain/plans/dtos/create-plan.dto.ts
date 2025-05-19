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
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanStatus } from '../entities/plan.entity';
import { IsAfterDate } from '@app/shared/utils/validators/date-range.validator';

export class CreatePlanDto {
  @ApiProperty({
    description: 'The name of the measurement plan',
    example: 'Q3 2023 Quality Improvement Plan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the measurement plan',
    example:
      'Plan focused on improving code quality metrics across all services',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Array of goal IDs included in this plan',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  goalIds: string[];

  @ApiProperty({
    description: 'Array of objective IDs included in this plan',
    example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  objectiveIds: string[];

  @ApiProperty({
    description: 'Status of the plan',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  @IsEnum(PlanStatus)
  @IsOptional()
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
  @ValidateIf((o: CreatePlanDto) => o.startDate != null)
  @IsAfterDate('startDate', { message: 'End date must be after start date' })
  endDate?: Date;

  @ApiProperty({
    description: 'Optional organization ID associated with this plan',
    example: '507f1f77bcf86cd799439015',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  organizationId?: string;

  @ApiProperty({
    description:
      'User ID who approved the plan (required for APPROVED or ACTIVE status)',
    example: '507f1f77bcf86cd799439016',
    required: false,
  })
  @ValidateIf(
    (o: CreatePlanDto) =>
      o.status === PlanStatus.APPROVED || o.status === PlanStatus.ACTIVE,
  )
  @IsMongoId()
  @IsDefined({
    message: 'approvedBy is required when plan is approved or active',
  })
  approvedBy?: string;

  @ApiProperty({
    description: 'Date when the plan was approved',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ValidateIf(
    (o: CreatePlanDto) =>
      o.status === PlanStatus.APPROVED || o.status === PlanStatus.ACTIVE,
  )
  approvedDate?: Date;
}
