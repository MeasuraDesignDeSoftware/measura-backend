import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({
    description: 'The name of the goal',
    minLength: 3,
    maxLength: 100,
    example: 'Improve Software Quality',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The description of the goal',
    minLength: 10,
    maxLength: 500,
    example:
      'Implement automated testing to improve software quality and reduce bugs.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;
}
