import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateQuestionDto {
  @ApiProperty({
    description: 'The text of the question',
    example: 'How can we reduce the number of bugs in production?',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  text?: string;

  @ApiProperty({
    description: 'The description or context of the question',
    example:
      'This question aims to identify measures to improve code quality and testing processes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'The ID of the goal this question is associated with',
    example: '60d21b4667d0d1d8ef9aa87a',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  goalId?: string;

  @ApiProperty({
    description: 'The priority of the question (1-5, with 1 being highest)',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;
}
