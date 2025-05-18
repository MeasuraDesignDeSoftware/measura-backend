import { ApiProperty } from '@nestjs/swagger';
import { Plan, PlanStatus } from '../entities/plan.entity';

export class PlanDto {
  @ApiProperty({ description: 'Unique identifier of the plan' })
  id: string;

  @ApiProperty({ description: 'Name of the plan' })
  name: string;

  @ApiProperty({ description: 'Description of the plan' })
  description: string;

  @ApiProperty({
    description: 'Goal IDs included in this plan',
    type: [String],
  })
  goalIds: string[];

  @ApiProperty({
    description: 'Objective IDs included in this plan',
    type: [String],
  })
  objectiveIds: string[];

  @ApiProperty({
    description: 'Status of the plan',
    enum: PlanStatus,
  })
  status: PlanStatus;

  @ApiProperty({
    description: 'Plan start date',
    required: false,
  })
  startDate?: Date;

  @ApiProperty({
    description: 'Plan end date',
    required: false,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'User ID who approved the plan',
    required: false,
  })
  approvedBy?: string;

  @ApiProperty({
    description: 'Date when the plan was approved',
    required: false,
  })
  approvedDate?: Date;

  @ApiProperty({
    description: 'Organization ID associated with this plan',
    required: false,
  })
  organizationId?: string;

  @ApiProperty({ description: 'User ID who created the plan' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Version number of the plan' })
  version: number;

  static fromEntity(plan: Plan): PlanDto {
    const dto = new PlanDto();
    dto.id = plan._id.toString();
    dto.name = plan.name;
    dto.description = plan.description;
    dto.goalIds = plan.goalIds.map((id) => id.toString());
    dto.objectiveIds = plan.objectiveIds.map((id) => id.toString());
    dto.status = plan.status;
    dto.startDate = plan.startDate;
    dto.endDate = plan.endDate;
    dto.approvedBy = plan.approvedBy?.toString();
    dto.approvedDate = plan.approvedDate;
    dto.organizationId = plan.organizationId?.toString();
    dto.createdBy = plan.createdBy.toString();
    dto.createdAt = plan.createdAt;
    dto.updatedAt = plan.updatedAt;
    dto.version = plan.version;
    return dto;
  }
}
