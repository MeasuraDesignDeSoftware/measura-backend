import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';
import { ComplexityLevel } from '@domain/fpa/entities/base-fpa-component.entity';

export class BaseFPAComponentDto {
  @ApiProperty({
    description: 'The name of the component',
    example: 'Customer Data',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'The description of the component',
    example:
      'Stores customer information including personal details and preferences',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'The project ID this component belongs to',
    example: '60a1e2c7b9b5a50d944b1e37',
  })
  @IsNotEmpty()
  @IsString()
  projectId: string;

  @ApiProperty({
    description: 'The complexity level of the component',
    enum: ComplexityLevel,
    example: ComplexityLevel.AVERAGE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ComplexityLevel)
  complexity?: ComplexityLevel;
}
