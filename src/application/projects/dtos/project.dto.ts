import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@domain/projects/entities/project.entity';
import { Type } from 'class-transformer';
import { UserDto } from '@application/users/dtos/user.dto';

export class ProjectDto {
  @ApiProperty({
    description: 'The unique identifier of the project',
    example: '60a1e2c7b9b5a50d944b1e37',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the project',
    example: 'E-commerce Platform Redesign',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the project',
    example:
      'Redesign the e-commerce platform to improve user experience and conversion rates',
  })
  description: string;

  @ApiProperty({
    description: 'The user who created the project',
    type: UserDto,
  })
  @Type(() => UserDto)
  createdBy: UserDto;

  @ApiProperty({
    description: 'The status of the project',
    enum: ProjectStatus,
    example: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @ApiProperty({
    description: 'The start date of the project',
    example: '2023-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'The expected end date of the project',
    example: '2023-06-30T00:00:00.000Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Team members assigned to the project',
    type: [UserDto],
  })
  @Type(() => UserDto)
  teamMembers: UserDto[];

  @ApiProperty({
    description: 'The date when the project was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the project was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<ProjectDto>) {
    Object.assign(this, partial);
  }
}
