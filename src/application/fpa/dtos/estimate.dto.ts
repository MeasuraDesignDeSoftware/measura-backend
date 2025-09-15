import { ApiProperty } from '@nestjs/swagger';
import { EstimateStatus } from '@domain/fpa/entities/estimate.entity';
import { Type } from 'class-transformer';
import { UserDto } from '@application/users/dtos/user.dto';
import { ProjectDto } from '@application/projects/dtos/project.dto';

export class EstimateDto {
  @ApiProperty({
    description: 'The unique identifier of the estimate',
    example: '60a1e2c7b9b5a50d944b1e48',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the estimate',
    example: 'ERP System Function Point Analysis',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the estimate',
    example: 'Function point analysis for the ERP system replacement project',
  })
  description: string;

  @ApiProperty({
    description: 'The organization this estimate belongs to',
    example: '60a1e2c7b9b5a50d944b1e37',
  })
  organizationId: string;

  @ApiProperty({
    description: 'The project this estimate belongs to',
    type: ProjectDto,
  })
  @Type(() => ProjectDto)
  project: ProjectDto;

  @ApiProperty({
    description: 'The user who created the estimate',
    type: UserDto,
  })
  @Type(() => UserDto)
  createdBy: UserDto;

  @ApiProperty({
    description: 'The status of the estimate',
    enum: EstimateStatus,
    example: EstimateStatus.DRAFT,
  })
  status: EstimateStatus;

  @ApiProperty({
    description: 'The unadjusted function point count',
    example: 320,
  })
  unadjustedFunctionPoints: number;

  @ApiProperty({
    description: 'The value adjustment factor',
    example: 1.05,
  })
  valueAdjustmentFactor: number;

  @ApiProperty({
    description: 'The adjusted function point count',
    example: 336,
  })
  adjustedFunctionPoints: number;

  @ApiProperty({
    description: 'The estimated effort in person-hours',
    example: 2688,
  })
  estimatedEffortHours: number;

  @ApiProperty({
    description: 'The productivity factor (hours per function point)',
    example: 8,
  })
  productivityFactor: number;

  @ApiProperty({
    description: 'References to Internal Logical Files (ILFs)',
    example: ['60a1e2c7b9b5a50d944b1e38', '60a1e2c7b9b5a50d944b1e39'],
    type: [String],
  })
  internalLogicalFiles: string[];

  @ApiProperty({
    description: 'References to External Interface Files (EIFs)',
    example: ['60a1e2c7b9b5a50d944b1e40', '60a1e2c7b9b5a50d944b1e41'],
    type: [String],
  })
  externalInterfaceFiles: string[];

  @ApiProperty({
    description: 'References to External Inputs (EIs)',
    example: ['60a1e2c7b9b5a50d944b1e42', '60a1e2c7b9b5a50d944b1e43'],
    type: [String],
  })
  externalInputs: string[];

  @ApiProperty({
    description: 'References to External Outputs (EOs)',
    example: ['60a1e2c7b9b5a50d944b1e44', '60a1e2c7b9b5a50d944b1e45'],
    type: [String],
  })
  externalOutputs: string[];

  @ApiProperty({
    description: 'References to External Queries (EQs)',
    example: ['60a1e2c7b9b5a50d944b1e46', '60a1e2c7b9b5a50d944b1e47'],
    type: [String],
  })
  externalQueries: string[];

  @ApiProperty({
    description:
      'The General System Characteristics values (0-5 for each of the 14 GSCs)',
    example: [3, 4, 2, 3, 4, 3, 3, 3, 2, 4, 3, 3, 2, 4],
    type: [Number],
  })
  generalSystemCharacteristics: number[];

  @ApiProperty({
    description: 'The date when the estimate was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the estimate was last updated',
    example: '2023-01-15T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Optional notes about the estimate',
    example: 'This is an initial estimate based on preliminary requirements',
  })
  notes: string;

  @ApiProperty({
    description: 'Version number for tracking changes',
    example: 1,
  })
  version: number;

  constructor(partial: Partial<EstimateDto>) {
    Object.assign(this, partial);
  }
}
