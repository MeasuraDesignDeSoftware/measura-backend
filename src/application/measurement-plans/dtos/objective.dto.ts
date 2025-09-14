import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto, UpdateQuestionDto } from './question.dto';

export class CreateObjectiveDto {
  @ApiProperty({
    description: 'The title of the objective',
    example: 'Improve software testing quality',
  })
  @IsNotEmpty({ message: 'Objective title is required' })
  @IsString({ message: 'Objective title must be a string' })
  objectiveTitle: string;

  @ApiProperty({
    description: 'The questions for this objective',
    type: [CreateQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Questions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateObjectiveDto {
  @ApiProperty({
    description: 'The title of the objective',
    example: 'Improve software testing quality',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Objective title must be a string' })
  objectiveTitle?: string;

  @ApiProperty({
    description: 'The questions for this objective',
    type: [UpdateQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Questions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  questions?: UpdateQuestionDto[];
}
