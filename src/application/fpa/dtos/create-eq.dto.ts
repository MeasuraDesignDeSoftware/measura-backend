import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateEQDto {
  @ApiProperty({
    description: 'Name of the External Query transaction',
    example: 'Customer Information Lookup',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Detailed description of the EQ transaction',
    example:
      'Query transaction that allows users to search and retrieve customer information by various criteria',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description:
      'Number of File Types Referenced (FTRs/ARs) - Referenced Files',
    example: 2,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileTypesReferenced?: number;

  @ApiProperty({
    description: 'Number of Data Element Types (DETs/TDs) - Types of Data',
    example: 18,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dataElementTypes?: number;

  // Special EQ calculation fields
  @ApiProperty({
    description:
      'Number of File Types Referenced for input parameters (special EQ calculation)',
    example: 1,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inputFtr?: number;

  @ApiProperty({
    description:
      'Number of Data Element Types for input parameters (special EQ calculation)',
    example: 5,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  inputDet?: number;

  @ApiProperty({
    description:
      'Number of File Types Referenced for output data (special EQ calculation)',
    example: 3,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  outputFtr?: number;

  @ApiProperty({
    description:
      'Number of Data Element Types for output data (special EQ calculation)',
    example: 12,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  outputDet?: number;

  @ApiProperty({
    description: 'Primary business purpose of this External Query transaction',
    example:
      'Allows users to search and retrieve customer information by ID, name, or email',
  })
  @IsNotEmpty()
  @IsString()
  primaryIntent: string;

  @ApiProperty({
    description: 'Search criteria and retrieval logic description',
    example:
      'Searches customer database using multiple criteria, applies security filters, returns formatted results',
    required: false,
  })
  @IsOptional()
  @IsString()
  retrievalLogic?: string;

  @ApiProperty({
    description: 'Output format and data presentation details',
    example:
      'Returns customer details in JSON format with contact information, account status, and recent activity',
    required: false,
  })
  @IsOptional()
  @IsString()
  outputFormat?: string;

  @ApiProperty({
    description:
      'Additional technical notes about query performance, caching, or special requirements',
    example:
      'Implements caching for frequently accessed records, includes pagination for large result sets',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
