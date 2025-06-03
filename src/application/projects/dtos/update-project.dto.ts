import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsDate,
  IsEnum,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '@domain/projects/entities/project.entity';

export class UpdateProjectDto {
  @ApiProperty({
    description: 'The name of the project',
    example: 'Updated E-commerce Platform Redesign',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'The description of the project',
    example: 'Updated redesign description with new goals',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'The status of the project',
    enum: ProjectStatus,
    example: ProjectStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({
    description: 'The start date of the project',
    example: '2023-01-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    description: 'The expected end date of the project',
    example: '2023-07-15T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({
    description: 'Team members assigned to the project',
    example: ['60a1e2c7b9b5a50d944b1e35', '60a1e2c7b9b5a50d944b1e36'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  teamMembers?: string[];
}
