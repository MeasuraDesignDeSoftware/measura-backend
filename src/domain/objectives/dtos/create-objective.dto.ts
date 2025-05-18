import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsMongoId,
  ArrayMinSize,
} from 'class-validator';
import { ObjectiveStatus } from '../entities/objective.entity';

export class CreateObjectiveDto {
  @ApiProperty({
    description: 'The name of the measurement objective',
    example: 'Improve code quality',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the measurement objective',
    example: 'Focus on reducing technical debt and improving maintainability',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Array of goal IDs associated with this objective',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  goalIds: string[];

  @ApiProperty({
    description: 'Status of the objective',
    enum: ObjectiveStatus,
    default: ObjectiveStatus.DRAFT,
  })
  @IsEnum(ObjectiveStatus)
  @IsOptional()
  status?: ObjectiveStatus;

  @ApiProperty({
    description: 'Optional organization ID associated with this objective',
    example: '507f1f77bcf86cd799439013',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  organizationId?: string;
}
