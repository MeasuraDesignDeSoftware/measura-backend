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
import { CreateMetricDto, UpdateMetricDto } from './metric.dto';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'The text of the question',
    example: 'How reliable is our testing process?',
  })
  @IsNotEmpty({ message: 'Question text is required' })
  @IsString({ message: 'Question text must be a string' })
  questionText: string;

  @ApiProperty({
    description: 'The metrics for this question',
    type: [CreateMetricDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateMetricDto)
  metrics?: CreateMetricDto[];
}

export class UpdateQuestionDto {
  @ApiProperty({
    description: 'The text of the question',
    example: 'How reliable is our testing process?',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Question text must be a string' })
  questionText?: string;

  @ApiProperty({
    description: 'The metrics for this question',
    type: [UpdateMetricDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateMetricDto)
  metrics?: UpdateMetricDto[];
}
