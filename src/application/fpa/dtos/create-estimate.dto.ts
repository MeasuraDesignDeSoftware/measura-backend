import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class CreateEstimateDto {
  @ApiProperty({
    description: 'The name of the estimate',
    example: 'ERP System Function Point Analysis',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The description of the estimate',
    example: 'Function point analysis for the ERP system replacement project',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'The project ID this estimate belongs to',
    example: '60a1e2c7b9b5a50d944b1e37',
  })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({
    description: 'The productivity factor (hours per function point)',
    example: 8,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  productivityFactor?: number;

  @ApiProperty({
    description: 'References to Internal Logical Files (ILFs)',
    example: ['60a1e2c7b9b5a50d944b1e38', '60a1e2c7b9b5a50d944b1e39'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  internalLogicalFiles?: string[];

  @ApiProperty({
    description: 'References to External Interface Files (EIFs)',
    example: ['60a1e2c7b9b5a50d944b1e40', '60a1e2c7b9b5a50d944b1e41'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalInterfaceFiles?: string[];

  @ApiProperty({
    description: 'References to External Inputs (EIs)',
    example: ['60a1e2c7b9b5a50d944b1e42', '60a1e2c7b9b5a50d944b1e43'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalInputs?: string[];

  @ApiProperty({
    description: 'References to External Outputs (EOs)',
    example: ['60a1e2c7b9b5a50d944b1e44', '60a1e2c7b9b5a50d944b1e45'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalOutputs?: string[];

  @ApiProperty({
    description: 'References to External Queries (EQs)',
    example: ['60a1e2c7b9b5a50d944b1e46', '60a1e2c7b9b5a50d944b1e47'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  externalQueries?: string[];

  @ApiProperty({
    description:
      'The General System Characteristics values (0-5 for each of the 14 GSCs)',
    example: [3, 4, 2, 3, 4, 3, 3, 3, 2, 4, 3, 3, 2, 4],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(5, { each: true })
  @ArrayMinSize(14)
  @ArrayMaxSize(14)
  generalSystemCharacteristics?: number[];

  @ApiProperty({
    description: 'Optional notes about the estimate',
    example: 'This is an initial estimate based on preliminary requirements',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
