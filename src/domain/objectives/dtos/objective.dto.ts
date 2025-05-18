import { ApiProperty } from '@nestjs/swagger';
import { Objective, ObjectiveStatus } from '../entities/objective.entity';

export class ObjectiveDto {
  @ApiProperty({ description: 'Unique identifier of the objective' })
  id: string;

  @ApiProperty({ description: 'Name of the objective' })
  name: string;

  @ApiProperty({ description: 'Description of the objective' })
  description: string;

  @ApiProperty({
    description: 'Goal IDs linked to this objective',
    type: [String],
  })
  goalIds: string[];

  @ApiProperty({
    description: 'Status of the objective',
    enum: ObjectiveStatus,
  })
  status: ObjectiveStatus;

  @ApiProperty({
    description: 'Organization ID associated with this objective',
    required: false,
  })
  organizationId?: string;

  @ApiProperty({ description: 'User ID who created the objective' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  static fromEntity(objective: Objective): ObjectiveDto {
    const dto = new ObjectiveDto();
    dto.id = objective._id.toString();
    dto.name = objective.name;
    dto.description = objective.description;
    dto.goalIds = objective.goalIds.map((id) => id.toString());
    dto.status = objective.status;
    dto.organizationId = objective.organizationId?.toString();
    dto.createdBy = objective.createdBy.toString();
    dto.createdAt = objective.createdAt;
    dto.updatedAt = objective.updatedAt;
    return dto;
  }
}
