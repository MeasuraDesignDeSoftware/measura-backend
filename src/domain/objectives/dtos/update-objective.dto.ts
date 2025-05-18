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

export class UpdateObjectiveDto {
  @ApiProperty({
    description: 'The name of the measurement objective',
    example: 'Improve code quality',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Detailed description of the measurement objective',
    example: 'Focus on reducing technical debt and improving maintainability',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of goal IDs associated with this objective',
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
    description: 'Status of the objective',
    enum: ObjectiveStatus,
    required: false,
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
