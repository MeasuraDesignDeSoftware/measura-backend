import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateALIDto {
  @ApiProperty({
    description: 'Name of the Internal Logical File',
    example: 'Customer Data',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the Internal Logical File',
    example:
      'Stores customer information including personal details and preferences',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Number of record element types (RETs)',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of data element types (DETs)',
    example: 15,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description: 'Optional notes about this ILF',
    example: 'Contains sensitive data that requires special handling',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
