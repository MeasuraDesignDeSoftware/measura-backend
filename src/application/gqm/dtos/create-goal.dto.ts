import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({
    description: 'The name of the goal',
    example: 'Improve code quality',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The description of the goal',
    example:
      'Reduce the number of bugs and improve maintainability of the codebase',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;
}
