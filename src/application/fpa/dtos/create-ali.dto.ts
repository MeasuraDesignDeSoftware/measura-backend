import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateALIDto {
  @ApiProperty({
    description: 'Name of the Internal Logical File',
    example: 'Customer Master File',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the ALI',
    example:
      'Maintains comprehensive customer information including personal details, preferences, and account status',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Number of Record Element Types (RETs/TRs) - Types of Records',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  recordElementTypes: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 15,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  dataElementTypes: number;

  @ApiProperty({
    description:
      'Primary purpose and business function of this Internal Logical File',
    example:
      'Stores customer information including contact details, preferences, and account status',
  })
  @IsNotEmpty()
  @IsString()
  primaryIntent: string;

  @ApiProperty({
    description:
      'Additional technical notes about data structure, relationships, or constraints',
    example: 'Includes encrypted payment information and audit trail fields',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
