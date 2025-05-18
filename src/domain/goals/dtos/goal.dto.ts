import { ApiProperty } from '@nestjs/swagger';
import { Goal, GoalStatus } from '../entities/goal.entity';

export class GoalDto {
  @ApiProperty({
    description: 'The unique identifier of the goal',
    example: '60d21b4667d0d1d8ef9aa87a',
  })
  id: string;

  @ApiProperty({
    description: 'The name of the goal',
    example: 'Improve code quality',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the goal',
    example:
      'Reduce the number of bugs and improve maintainability of the codebase',
  })
  description: string;

  @ApiProperty({
    description: 'The ID of the user who created the goal',
    example: '60d21b4667d0d1d8ef9aa87e',
  })
  createdBy: string;

  @ApiProperty({
    description: 'The date when the goal was created',
    example: '2023-06-19T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The date when the goal was last updated',
    example: '2023-06-20T14:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'The status of the goal',
    example: 'ACTIVE',
    enum: GoalStatus,
  })
  status: GoalStatus;

  constructor(partial: Partial<GoalDto>) {
    Object.assign(this, partial);
  }

  static fromEntity(goal: Goal): GoalDto {
    return new GoalDto({
      id: goal._id?.toString(),
      name: goal.name,
      description: goal.description,
      createdBy: goal.createdBy?.toString(),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      status: goal.status || GoalStatus.ACTIVE,
    });
  }
}
